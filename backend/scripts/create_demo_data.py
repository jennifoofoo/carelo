"""Create demo data for testing and development."""
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone
from sqlmodel import Session, select

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from src.db.session import engine
from src.db.models import User, Case, Note, Task, HelpPlanDraft, Insight, Highlight
from src.utils.jwt import hash_password


def create_demo_data():
    """Create comprehensive demo data for testing."""
    with Session(engine) as session:
        # Get or create demo user
        statement = select(User).where(User.email == "demo@carelo.de")
        demo_user = session.exec(statement).first()
        
        if not demo_user:
            demo_user = User(
                email="demo@carelo.de",
                password=hash_password("demo"),
                full_name="Demo User",
                organization="CareLo Demo"
            )
            session.add(demo_user)
            session.commit()
            session.refresh(demo_user)
        
        # Check if demo cases already exist - always recreate to ensure fresh data
        statement = select(Case).where(Case.user_id == demo_user.id)
        existing_cases = session.exec(statement).all()
        
        force_reset = os.getenv("RESET_DEMO_DATA", "false").lower() == "true"

        if existing_cases:
            if not force_reset:
                print("✅ Demo data already exists. Skipping recreation.")
                print("   (Set RESET_DEMO_DATA=true to force a full reset.)")
                return
            print("🔄 RESET_DEMO_DATA=true — wiping and recreating demo data...")
            # Delete existing demo data to recreate fresh
            case_ids = [case.id for case in existing_cases]
            
            # CRITICAL: Delete ALL reports for demo user FIRST (including orphaned ones)
            # This must happen BEFORE deleting cases to avoid FK constraint issues
            from src.db.models import Report
            statement = select(Report).where(Report.user_id == demo_user.id)
            all_reports = session.exec(statement).all()
            for report in all_reports:
                session.delete(report)
            if all_reports:
                print(f"🗑️  Deleted {len(all_reports)} reports (including orphaned)")
            
            # Commit report deletions separately to avoid FK issues
            session.commit()
            
            # Extract case IDs BEFORE any deletions to avoid detached instance errors
            case_id_list = [case.id for case in existing_cases]
            
            # Delete highlights for these cases (and any orphaned highlights)
            statement = select(Highlight).where(
                (Highlight.case_id.in_(case_ids)) | (Highlight.case_id.is_(None))
            )
            highlights = session.exec(statement).all()
            for highlight in highlights:
                session.delete(highlight)
            
            # Use extracted IDs instead of case.id to avoid detached instance errors
            for case_id in case_id_list:
                # Delete related data using case_id directly
                statement = select(Note).where(Note.case_id == case_id)
                notes = session.exec(statement).all()
                for note in notes:
                    session.delete(note)
                
                statement = select(Task).where(Task.case_id == case_id)
                tasks = session.exec(statement).all()
                for task in tasks:
                    session.delete(task)
                
                statement = select(HelpPlanDraft).where(HelpPlanDraft.case_id == case_id)
                help_plans = session.exec(statement).all()
                for plan in help_plans:
                    session.delete(plan)
                
                statement = select(Insight).where(Insight.case_id == case_id)
                insights = session.exec(statement).all()
                for insight in insights:
                    session.delete(insight)
                
            # Delete cases after all related data is removed
            for case in existing_cases:
                session.delete(case)
            
            session.commit()
            print("🗑️  Deleted existing demo data")
        
        print("🎭 Creating demo data...")

        # Create 6 fictional demo cases covering realistic social work scenarios
        cases_data = [
            {
                "client_name": "Emma Schreiber",
                "client_id": "1047",
                "status": "active",
                "priority": "high",
                "description": "34-year-old single mother of two children facing housing instability and financial difficulties after separation."
            },
            {
                "client_name": "Klaus Hoffmann",
                "client_id": "1083",
                "status": "active",
                "priority": "medium",
                "description": "71-year-old with mobility issues and chronic health conditions; struggles with medication management and social isolation."
            },
            {
                "client_name": "Layla Nassir",
                "client_id": "1102",
                "status": "active",
                "priority": "high",
                "description": "22-year-old refugee navigating integration process, language barriers, and vocational training in Munich."
            },
            {
                "client_name": "Tobias Bergmann",
                "client_id": "1056",
                "status": "active",
                "priority": "high",
                "description": "46-year-old divorced father in alcohol recovery; ongoing child custody concerns and employment instability."
            },
            {
                "client_name": "Sophie Richter",
                "client_id": "1119",
                "status": "active",
                "priority": "medium",
                "description": "27-year-old dealing with depression and anxiety, housing instability, and social isolation after job loss."
            },
            {
                "client_name": "Finn Kowalski",
                "client_id": "1134",
                "status": "active",
                "priority": "medium",
                "description": "16-year-old in residential youth care facility; school difficulties, behavioral challenges, and family conflict."
            }
        ]
        
        cases = []
        for case_data in cases_data:
            case = Case(
                user_id=demo_user.id,
                title=f"Case {case_data['client_id']}",
                **case_data
            )
            session.add(case)
            cases.append(case)
        
        session.commit()
        for case in cases:
            session.refresh(case)
        
        print(f"✅ Created {len(cases)} demo cases")
        
        # Create notes for each case
        notes_data = [
            # Case 0: Emma Schreiber (34, single mother, housing/financial)
            {
                "case_index": 0,
                "notes": [
                    {
                        "source": "text",
                        "normalized": "Initial Assessment – Emma Schreiber, 34 years old, referred by Jobcenter München after missing two mandatory appointments. Emma is a single mother of two children: Leon (9) and Mia (6). She separated from her partner Thomas eight months ago following repeated domestic disputes. Currently renting a two-room apartment in Neuhausen; landlord has sent a formal rent arrears notice for three months of unpaid rent totaling €2,400. Emma works part-time (20 hours/week) as a supermarket cashier earning approximately €960 net per month. She receives Kindergeld (€250/month for two children) and has applied for Wohngeld but the application has been pending for 11 weeks. No Unterhaltsvorschuss has been filed yet – Emma was unaware this was available. Children appear well-cared-for and are attending school and Kita without issues noted by teachers. Emma presented as exhausted and overwhelmed but engaged and cooperative. Priority concerns: imminent eviction risk, debt accumulation, and gaps in benefit entitlements.",
                        "metadata": {"category": "Initial Assessment"}
                    },
                    {
                        "source": "text",
                        "normalized": "Counseling Session – Second meeting with Emma. She arrived 10 minutes late, apologized and explained the Kita had called about Mia having a fever. Discussed the Wohngeld application status: called Wohnungsamt together during session – application is still in queue, estimated processing time another 4–6 weeks. Emma visibly distressed. We reviewed her monthly budget in detail: income €960 (work) + €250 (Kindergeld) = €1,210. Fixed costs: rent €780, electricity €85, insurance €42, phone €29 = €936. Remaining: €274/month for food, transport, clothing, school materials for two children. This is clearly insufficient. Discussed applying for Bürgergeld as a top-up. Emma resistant at first – 'I don't want to be a charity case' – but opened up about how the financial pressure is affecting her sleep and her relationship with the children. She reported snapping at Leon last week and feeling like a 'bad mother'. Normalized her experience and reframed seeking available benefits as responsible parenting. Emma agreed to proceed with Bürgergeld application. Also initiated Unterhaltsvorschuss paperwork – Thomas's whereabouts are known but he has not paid any child support since the separation.",
                        "metadata": {"category": "Counseling"}
                    },
                    {
                        "source": "text",
                        "normalized": "Home Visit – Conducted home visit at Emma's apartment in Neuhausen. Two-room apartment, approximately 52 sqm. Apartment is tidy and children have a dedicated sleeping area separated by a curtain. Evidence of caring home environment: children's drawings on fridge, books on shelf, Mia's crayon art displayed. Kitchen adequately stocked. Emma showed me the landlord's Abmahnung letter (formal warning). Landlord has indicated he will file for eviction if rent arrears not settled within 30 days. Spoke with Emma about contacting the Mieterverein München for free legal advice regarding tenant rights during this period. Emma mentioned a neighbor (Maria, 68) has been helping with childcare on difficult days – positive informal support network. Noted that the apartment has some dampness around the bathroom window; advised Emma to document this in writing to landlord to preempt any disputes. Children were present during visit, both appear healthy and happy. Leon proudly showed me a drawing he made at school. No immediate safety concerns for the children.",
                        "metadata": {"category": "Home Visit"}
                    },
                    {
                        "source": "text",
                        "normalized": "Follow-up – Telephone follow-up with Emma. Good news: Bürgergeld application submitted last week at Jobcenter. Estimated processing time 3–4 weeks. Wohngeld application finally approved – €195/month effective next month. This brings monthly income up to €1,405, which is still tight but significantly better. Emma has contacted Mieterverein München and has an appointment next Tuesday for free legal consultation on the rent arrears situation. Thomas (the children's father) has been formally notified about Unterhaltsvorschuss proceedings. Emma reports children are doing well – Leon's teacher noted he seems happier and more engaged in class this week. Emma herself sounds more optimistic. She mentioned she signed up for a free budgeting workshop at the Caritas center next Saturday. Risk still present: eviction proceedings could still be initiated before Bürgergeld payment clears. Advised Emma to request a short-term payment agreement (Ratenzahlung) from her landlord in writing, referencing the pending benefit approvals. Emma agreed to send this letter today.",
                        "metadata": {"category": "Follow-up"}
                    },
                    {
                        "source": "text",
                        "normalized": "Crisis Call – Emma called in distress at 18:40. Landlord had delivered an official Räumungsklage (eviction lawsuit) notice. Emma was crying and panicking. I stayed on the line, helped her calm down, and walked through what this means practically: the eviction lawsuit starts a court process that typically takes 2–3 months, she is not being physically removed today. Advised her to immediately bring the court documents to her Mieterverein appointment on Tuesday and to additionally contact the Wohnungsamt emergency office tomorrow morning as they have a fund for preventing evictions in acute cases. Reminded Emma that her Bürgergeld payment should clear within 2 weeks, which would allow partial rent settlement. Emma calmed down significantly and felt she had a plan. Agreed to call me tomorrow after contacting Wohnungsamt. Note: this crisis highlights the vulnerability of her situation. Even with benefits coming through, the timeline gap creates real eviction risk. Will explore whether emergency housing assistance (Wohnungsnotfall München) is applicable here as a safety net.",
                        "metadata": {"category": "Crisis Call"}
                    },
                    {
                        "source": "text",
                        "normalized": "Progress Note – Meeting with Emma three weeks after the crisis call. Significant progress: Bürgergeld approved and first payment of €380/month received. Combined with Wohngeld (€195) and adjusted budget, Emma now has approximately €1,590/month. Wohnungsamt emergency fund provided a one-time payment of €800 toward rent arrears – she paid this directly to landlord. Landlord agreed in writing to a repayment plan for the remaining €1,600 over 8 months (€200/month). Räumungsklage has been withdrawn. Emma was emotional when sharing this – 'I thought we were going to lose our home.' Underhaltsvorschuss also confirmed: €272/month for both children effective this month. Emma's total monthly income is now approximately €1,590 + €272 = €1,862, with rent at €780. She has a realistic monthly surplus for the first time in eight months. Next priorities: explore whether Emma can increase working hours once Mia starts primary school in September, and continue monitoring her mental health – she mentioned sleep remains disrupted and she still feels anxious much of the time. Referred to Familienzentrum Neuhausen for free parenting support group and individual counseling.",
                        "metadata": {"category": "Progress Note"}
                    }
                ]
            },
            # Case 1: Klaus Hoffmann (71, elderly, mobility/isolation)
            {
                "case_index": 1,
                "notes": [
                    {
                        "source": "text",
                        "normalized": "Initial Assessment – Klaus Hoffmann, 71 years old, referred by his GP (Dr. Müller, Hausarzt in Schwabing) due to concerns about medication non-adherence and increasing social isolation. Klaus lives alone in a two-room apartment in München-Schwabing. His wife Helga passed away two years ago after 43 years of marriage; Klaus has not fully processed this bereavement. Has one adult daughter, Christine, who lives in Hamburg and visits approximately every 6–8 weeks. Klaus has Type 2 diabetes (controlled), hypertension, and mild osteoarthritis in both knees. Takes 6 different daily medications. Dr. Müller reports that Klaus has missed or taken incorrect doses multiple times, including skipping his blood pressure medication for several days last month. Klaus presents as mentally alert and articulate, with good long-term memory but some difficulty with daily routine since wife's death. He managed the household together with Helga for decades and now struggles with all domestic tasks she previously handled, including cooking, grocery shopping, and administrative matters. No cognitive decline noted. Mobility: walks with a cane, uses stairs slowly. Apartment on 3rd floor, no lift. Primary concerns: medication management, fall risk, social isolation, and grief processing.",
                        "metadata": {"category": "Initial Assessment"}
                    },
                    {
                        "source": "text",
                        "normalized": "Counseling Session – Second meeting with Klaus at his apartment. Klaus was pleased to have a visitor. Apartment clean but somewhat sparse – Helga's photographs still in every room. Klaus prepared coffee and was eager to talk. He spoke at length about Helga – how she managed everything, how much he misses her company, and how quiet the apartment feels now. Gently introduced the topic of his medication routine. Klaus showed me his medication bottles – no system in place, all kept in a drawer. He admitted he sometimes forgets, especially in the evening. He also mentioned he sometimes skips meals ('don't see the point cooking just for myself') which affects when he can safely take diabetes medication. Discussed simple strategies: introduced the idea of a weekly pill organizer. Klaus was initially dismissive ('I'm not senile') but warmed to the idea when framed as convenient rather than compensatory. Agreed to trial a pill organizer for two weeks. Also discussed his daily schedule: Klaus leaves the apartment about twice per week – once for groceries (Edeka nearby) and once for a haircut or similar errand. Rarely sees neighbors. Used to attend a chess group but stopped after Helga's death ('felt wrong to enjoy myself'). Reconnecting with chess group could be valuable – will explore.",
                        "metadata": {"category": "Counseling"}
                    },
                    {
                        "source": "text",
                        "normalized": "Home Visit – Formal home visit to assess living conditions and daily functioning. Apartment: 58 sqm, third floor, no elevator. Hallway narrow. Bathroom: standard tub, no grab bars, no non-slip mat. Klaus confirmed he had a minor slip getting out of the bath two months ago – did not tell Christine or his doctor. No injury but this is a significant fall risk indicator. Kitchen: functional, but Klaus rarely cooks – eats bread, cold cuts, and ready meals. Nutritional adequacy questionable given diabetes diagnosis. Heating adequate. Medication storage: pill organizer now in use as agreed – correctly filled for this week, which is positive. Assessed stairs: Klaus manages but grips the wall rather than a handrail on one side where no rail is installed. Recommended installation of additional handrail to building management. Identified key risks: bathroom fall risk, inadequate nutrition, no emergency contact system in place, and no medical alert device. Christine is aware of some concerns but may not know the full picture. Will coordinate a three-way call to align on support plan. Klaus's mental state: lonely but stable. No signs of depression requiring clinical intervention at this stage, but grief and isolation are present. He mentioned the chess group again – seemed wistful. Encouraged him to contact them.",
                        "metadata": {"category": "Home Visit"}
                    },
                    {
                        "source": "text",
                        "normalized": "Follow-up – Telephone check-in with Klaus. Medication update: pill organizer consistently used for three weeks. Klaus reports he has not missed a dose. Dr. Müller confirmed at Klaus's last appointment that blood pressure readings have improved. Small but important win. Social update: Klaus attended the chess group at the local Seniorenzentrum for the first time in 18 months. He went 'just to see' and ended up staying three hours. Reported it was 'good to use the brain again' and that the others were pleased to see him. He is planning to go again next Tuesday. Physical safety: grab bars ordered for bathroom through Pflegekasse (health insurance). Installation scheduled for next week. Building management agreed to install a second handrail on the staircase. Meals: daughter Christine has arranged for Essen auf Rädern (meals on wheels) delivery 4 days per week. Klaus was resistant at first but tried it and admits the food is 'not bad'. Nutrition improving. Coordination with Christine: spoke with her by phone; she was not aware of the bathroom slip or the full extent of her father's isolation. She was visibly relieved by the progress made and wants to schedule monthly calls with me. Agreed. Next goal: assess whether Hausnotruf (emergency call button) would be accepted by Klaus.",
                        "metadata": {"category": "Follow-up"}
                    }
                ]
            },
            # Case 2: Layla Nassir (22, refugee, integration/vocational training)
            {
                "case_index": 2,
                "notes": [
                    {
                        "source": "text",
                        "normalized": "Initial Assessment – Layla Nassir, 22 years old, Syrian national. Arrived in Germany 14 months ago via family reunification visa (sister already resident in Munich). Referred by the Beratungsstelle für Flüchtlinge at AWO München. Currently holds a temporary Aufenthaltserlaubnis (residence permit) valid for 18 months, expiring in 7 months. Lives in a 3-room shared apartment in Milbertshofen with her sister (Nour, 28) and Nour's husband. Layla's own family (parents and two brothers) are still in Aleppo. She has sporadic contact with them via WhatsApp but communication is unreliable. Layla completed secondary school in Syria (graduated 2020) and was studying education at a university in Aleppo before the family decided she should leave for safety reasons. German language level: B1 (completed Integrationskurs). Arabic and basic English. Primary concerns: residence permit renewal (requires proof of integration progress and economic activity), vocational training pathway, financial independence, and mental health (unprocessed trauma and separation from family). Layla presents as intelligent, motivated, and articulate. She is eager to work and study but feels uncertain about which direction to take in the German system.",
                        "metadata": {"category": "Initial Assessment"}
                    },
                    {
                        "source": "text",
                        "normalized": "Counseling Session – Second meeting, office-based. Explored Layla's background and aspirations in more depth. In Syria she had wanted to become a teacher. This aspiration remains but she is pragmatic: 'I want to work and contribute, not just wait.' Discussed the German vocational training (Ausbildung) system in detail – she was unfamiliar with the dual system (workplace + Berufsschule). We mapped out options based on her interests and language level. Layla is interested in social work (Soziale Arbeit) or nursing (Pflegeausbildung) given her background and values. Nursing is particularly relevant given strong demand and the fact that a Pflegeausbildung comes with a training salary. Concerns: German language requirements for Berufsschule are typically B2. Layla is at B1 and would need to reach B2 before starting. Ausländerbehörde: reviewed upcoming permit renewal requirements. She needs to demonstrate sufficient German language progress and either employment or enrollment in a recognized training or education program. Timeline is tight given 7-month validity remaining. Action plan: (1) Enroll in B2 German course, (2) Contact Pflegeschule München regarding Ausbildungsstart September, (3) Request early appointment at Ausländerbehörde to clarify permit extension options.",
                        "metadata": {"category": "Counseling"}
                    },
                    {
                        "source": "text",
                        "normalized": "Home Visit – Visited Layla at the shared apartment in Milbertshofen. Met her sister Nour briefly. Apartment is comfortable and the family dynamic seems warm and supportive. Layla has a small desk in the shared living room where she studies. She showed me her German learning materials – textbooks, flashcards, and a notebook filled with vocabulary. Clearly motivated and diligent. Nour's husband works in construction; Nour works part-time at a Kita. The family dynamic is generally supportive but Layla mentioned feeling like a burden – 'They have their own life, their own problems. I don't want to always need help.' This internalized pressure is worth monitoring. During the visit Layla received a WhatsApp voice message from her mother in Aleppo. She excused herself and listened in the hallway, returned with red eyes but composed herself quickly. When gently asked, she said 'My parents are okay, just worried about me.' She rarely discusses the situation in Aleppo directly. Possible unprocessed anxiety and grief. Recommended she consider the free psychological counseling service for refugees offered by Refugio München. She noted the information down but seemed uncertain about following through. No safety concerns. Living conditions adequate.",
                        "metadata": {"category": "Home Visit"}
                    },
                    {
                        "source": "text",
                        "normalized": "Progress Note – Meeting with Layla six weeks after initial assessment. Significant progress: Enrolled in B2 German course at VHS München (starts in two weeks, 20 hours per week intensive). Ausländerbehörde appointment completed – permit extension granted for additional 12 months based on language course enrollment and demonstrated integration progress. Enormous relief for Layla. She described the appointment as stressful but straightforward once all documents were in order. Nursing Ausbildung pathway: Met with admissions coordinator at Berufsfachschule für Pflege München. They offer a September intake. Requirements: B2 German language certificate, Hauptschulabschluss equivalent (her Syrian certificate needs assessment by Bildungsberatung), health clearance, and a short-term orientation internship (2-week Praktikum). Layla has completed the Bildungsberatung appointment – Syrian school certificate recognized as equivalent to Mittlere Reife, which qualifies her for the Pflegeausbildung. Currently arranging the Praktikum at a local nursing home through the school's placement network. Mental health: Layla attended one session at Refugio München. She said it was helpful and has booked a second appointment. This is meaningful progress – she initially dismissed the idea. Financial situation: Currently supported by Grundsicherung (Bürgergeld for non-employed residents) plus sister's support. Once Ausbildung starts, she will receive a training salary (~€1,100/month in year 1), which will significantly improve her autonomy.",
                        "metadata": {"category": "Progress Note"}
                    },
                    {
                        "source": "text",
                        "normalized": "Follow-up – Brief meeting ahead of Ausbildung start. Layla has completed the B2 German intensive course and achieved B2 certification – genuinely impressive given she was at B1 three months ago. She is visibly more confident in German conversation. Praktikum completed at a nursing home in Bogenhausen: supervisor gave a positive assessment, describing Layla as 'empathetic, hard-working, and a quick learner.' Ausbildung at Berufsfachschule für Pflege München confirmed to start on September 1st. She has received the enrollment letter and student ID. Layla is both excited and nervous. She mentioned worrying about keeping up with the Berufsschule material since her technical German vocabulary is still developing. We discussed strategies: connecting with other international students in her cohort, using the school's tutoring support service, and continuing to build vocabulary systematically. Family in Aleppo: situation stable at the moment. Layla was able to have a video call with her parents last week for the first time in two months – she described this as 'the best day I've had in Germany.' Looking ahead: once Layla is settled in the Ausbildung, will reduce contact frequency to monthly check-ins. She has strong support from her sister and now has a clear professional pathway.",
                        "metadata": {"category": "Follow-up"}
                    }
                ]
            },
            # Case 3: Tobias Bergmann (46, alcohol recovery, custody)
            {
                "case_index": 3,
                "notes": [
                    {
                        "source": "text",
                        "normalized": "Initial Assessment – Tobias Bergmann, 46 years old, referred by the Familiengericht München following a custody dispute. Tobias has been in alcohol recovery for 8 months. He was diagnosed with alcohol use disorder (severe) four years ago. His marriage to Sabine ended in divorce two years ago, in part due to his alcohol dependence. They have one daughter together: Lena, 11 years old. Current custody arrangement: Lena lives with Sabine (primary residence). Tobias has supervised visitation rights (2 hours per week at the Beratungsstelle, supervised by a social worker). Sabine has requested full custody removal of visitation rights, citing ongoing concerns about Tobias's reliability and stability. Tobias disputes this and wants to rebuild his relationship with Lena. Tobias is currently employed as a warehouse operative (Lagerarbeiter) on a temporary contract (6 months) at a logistics company in Munich. Previously worked as an auto mechanic for 15 years before his dependence affected his performance and he lost that job. Currently lives in a 1-room apartment in Maxvorstadt, subsidized through Sozialamt. Appears motivated to maintain sobriety and rebuild his life. Attended Fachambulanz Sucht counseling weekly since beginning recovery. Has not consumed alcohol in 8 months (self-report, confirmed by Fachambulanz). Primary concerns: maintaining sobriety, improving custody situation, employment stability, and rebuilding relationship with daughter.",
                        "metadata": {"category": "Initial Assessment"}
                    },
                    {
                        "source": "text",
                        "normalized": "Counseling Session – Second meeting with Tobias. He arrived on time and seemed anxious but focused. He talked about the supervised visit with Lena earlier in the week: 'She barely spoke to me. She kept looking at the social worker like she wanted permission.' He was upset but handled his emotions well during our session. We discussed the impact of his past behavior on Lena and on Sabine's trust, and the work required to rebuild that trust slowly. Tobias showed insight into how his drinking had affected his daughter: 'I wasn't there. I was present but I wasn't there.' He described specific incidents he regrets deeply – missing school events, an argument with Sabine in front of Lena that ended with him driving while intoxicated. He has clearly done significant reflective work in his Fachambulanz sessions. We discussed what stable, responsible fatherhood could look like in the short term: consistency, reliability, and patience even when visits are difficult. Tobias mentioned his employment situation: the temporary contract expires in 4 months. His supervisor has indicated the work has been good and there may be a permanent contract offer, but nothing confirmed. Financial stability is important for the custody case – we will need to document income and housing stability for the Familiengericht. Also discussed: Tobias attends AA meetings twice a week and finds them helpful. He has a sponsor he trusts.",
                        "metadata": {"category": "Counseling"}
                    },
                    {
                        "source": "text",
                        "normalized": "Home Visit – Visited Tobias at his apartment in Maxvorstadt. 1-room apartment, approximately 28 sqm, modestly furnished but clean and orderly. No signs of alcohol (checked unobtrusively). A drawing from Lena is pinned to the wall above his desk – from about three years ago, before the worst period. Tobias mentioned he keeps it as a reminder of why he's doing this. He made tea and we talked for about an hour. Reviewed his sobriety plan: Fachambulanz counseling (weekly), AA meetings (twice weekly), sponsor contact available by phone. He also attends a sport group (volleyball) Thursday evenings at a local Sportverein – new activity he started 2 months ago, finds it helps with stress and social connection. Relationship with Lena: the court-ordered supervised visits are every Saturday. Tobias described the sessions as emotionally difficult but important. Lena is warming up slowly – last week she initiated a conversation about her school play. Tobias described this as 'the best two minutes of my week.' Relationship with Sabine: co-parenting communication is minimal and tense, conducted mainly through a court-approved communication app. Sabine has not acknowledged his recovery progress. Tobias accepts this but finds it isolating. Recommended he document every visit, every step of his recovery, and every sign of progress for the court process. He agreed.",
                        "metadata": {"category": "Home Visit"}
                    },
                    {
                        "source": "text",
                        "normalized": "Follow-up – Meeting with Tobias following a difficult week. He disclosed that Sabine's lawyer sent a letter requesting that supervised visits be reduced from weekly to bi-weekly, citing 'insufficient evidence of stable lifestyle.' Tobias was visibly shaken. We reviewed the evidence we have been compiling: 8 months sobriety documentation from Fachambulanz, stable employment (temporary contract renewed for additional 3 months), clean home environment, consistent visit attendance record. I advised Tobias to request a formal progress report from his Fachambulanz counselor and to submit this to his lawyer for the court proceedings. Tobias does not currently have legal representation and has been navigating the custody proceedings without a lawyer. This is a significant vulnerability. Discussed options: Beratungsstelle for Familien offers free legal consultation on family law matters. Tobias has an appointment next week. Good news: his workplace supervisor has verbally indicated a permanent contract offer is coming within the month. If confirmed, this will significantly strengthen his case. Emotional state: Tobias is stressed but not in crisis. He confirmed he has not had any urges to drink, attributes this to the structured support network. His AA sponsor has been particularly supportive this week. Sobriety milestone: 9 months on Friday. We acknowledged this together.",
                        "metadata": {"category": "Follow-up"}
                    },
                    {
                        "source": "text",
                        "normalized": "Progress Note – Tobias 11 months into recovery. Significant developments in custody situation. Familiengericht appointed an independent Verfahrensbeistand (guardian ad litem) for Lena to represent her interests in the custody proceedings. Initial Verfahrensbeistand assessment has been positive – report notes Tobias's consistent visit attendance, documented recovery progress, and stable living situation. Permanent employment contract signed last week – Tobias is now a permanent Lagerarbeiter earning €1,850/month net. This removes a major source of financial instability. Supervised visit schedule: Sabine's application to reduce visits was denied by the court pending the full Verfahrensbeistand report. Visits remain weekly. Lena's behavior during visits is gradually changing – she now talks more naturally and last Saturday asked Tobias to help her with a math problem. Tobias described this as 'huge'. Sabine: remains opposed to unsupervised visits but the court process is proceeding. Tobias's lawyer (accessed via Beratungsstelle) is preparing documentation for a formal review hearing in 6 weeks. If the Verfahrensbeistand report remains positive, unsupervised visits may be proposed by the court. Tobias understands this is a realistic but not guaranteed outcome. Mental health: continuing Fachambulanz weekly counseling. No relapses. Reports sleep is better and anxiety about the future has reduced since gaining permanent employment. Still processes deep guilt about the impact on Lena. Working on self-compassion within his recovery framework.",
                        "metadata": {"category": "Progress Note"}
                    }
                ]
            },
            # Case 4: Sophie Richter (27, depression/anxiety, housing instability)
            {
                "case_index": 4,
                "notes": [
                    {
                        "source": "text",
                        "normalized": "Initial Assessment – Sophie Richter, 27 years old, self-referred after being discharged from the Psychiatrische Tagesklinik at the LMU Klinikum three weeks ago. She completed a 6-week partial hospitalization program for major depressive disorder (MDD) and panic disorder. Sophie was diagnosed two years ago following a period of extreme work-related stress that led to a mental health crisis and eventual inability to work. She has been on Bürgergeld since losing her job 18 months ago. Sophie worked previously as a junior graphic designer at an agency in München-Mitte – the job ended when she became unable to meet deadlines due to her depression. Currently lives in a 1-room WG (shared flat) in Schwabing; WG contract is informal and the main tenant has indicated Sophie may need to leave by the end of the month as he is moving abroad. Sophie does not currently have savings to cover a rental deposit. Social network: described as 'very small.' One close friend (Anna) who lives in Berlin. Parents in Nuremberg – relationship is strained; they struggle to understand her mental illness and initially attributed it to 'weakness'. Strengths: intelligent, creative, and demonstrates good self-awareness about her condition. Has engaged well with psychiatric treatment. Takes her medication (sertraline + occasional lorazepam PRN) consistently. Primary concerns: housing instability, social isolation, reintegration into employment, and maintaining mental health gains from the Tagesklinik.",
                        "metadata": {"category": "Initial Assessment"}
                    },
                    {
                        "source": "text",
                        "normalized": "Counseling Session – Second meeting, office-based. Sophie arrived looking tired but presentable and engaged from the start. We spent most of the session on her housing situation as this is the most immediate concern. She has been searching WG listings on WG-Gesucht but has had no responses. Discussed the challenge: WG applications are competitive in Munich, and Sophie's situation (Bürgergeld income, no employment) makes applications more difficult. Strategies discussed: (1) Approach Sozialamt for emergency housing assistance and priority placement with Wohnheime für junge Erwachsene, (2) Contact Caritas Wohnhilfe for subsidized transitional housing, (3) Ask WG-Gesucht applicants directly if they can provide temporary room while main tenant is still present. Sophie had not approached any official housing support channels – she felt embarrassed about needing help. Gently explored this and the stigma she experiences around accessing welfare systems. Sophie made the connection herself to her depression: 'When I'm low, everything feels like too much effort and asking for help feels humiliating.' We identified this pattern as worth flagging to her psychiatrist as well. Mental health update: Sophie reports her mood has stabilized since leaving the Tagesklinik. She follows the structure recommended by her treatment team: waking before 9am, going outside daily, limiting social media to 30 minutes. She has largely kept to this routine, which is an accomplishment. Isolation remains the key emotional challenge.",
                        "metadata": {"category": "Counseling"}
                    },
                    {
                        "source": "text",
                        "normalized": "Follow-up – Check-in meeting two weeks after the counseling session. Housing: Caritas Wohnhilfe has confirmed Sophie is eligible for a place in a Betreutes Wohnen (supported housing) arrangement in Schwabing. This is a single room with shared facilities in a small house for young adults with mental health backgrounds. Rent is covered under Bürgergeld, social worker support on-site once a week, and community events organized monthly. Sophie is anxious about living with strangers but recognizes this as the safest option currently. Moving in next Saturday. This resolves the immediate housing crisis. Employment/reintegration: had a preliminary conversation about next steps. Sophie is not yet ready for full-time work but expresses a clear desire to re-engage with creative work. Discussed rehabilitation pathways: Eingliederungshilfe through the Jobcenter, which can fund therapeutic work placements (Zuverdienst), or a supported reintegration program specifically for people with mental health conditions (Zuverdienst Programm München). Sophie interested in exploring this. Also mentioned she has been doing small illustration projects for fun – a positive sign of reconnecting with her creative identity. Suggested she consider a low-pressure freelance platform to do occasional small projects when she feels able, as a confidence-building bridge before formal employment. Social connection: Sophie attended one group session at the Tagesklinik alumni network. Found it helpful but exhausting. Agreed to try one more before evaluating whether it's the right fit.",
                        "metadata": {"category": "Follow-up"}
                    }
                ]
            },
            # Case 5: Finn Kowalski (16, youth in care, school/family conflict)
            {
                "case_index": 5,
                "notes": [
                    {
                        "source": "text",
                        "normalized": "Initial Assessment – Finn Kowalski, 16 years old, currently residing in a Wohngruppe (residential youth care group home) run by the Diakonisches Werk in München-Giesing. Placed there 4 months ago by the Jugendamt following an escalating family conflict situation at home. Finn is the eldest of three children. His parents – Markus (44) and Vera (42) – are together but the family has experienced significant conflict over the past two years. Markus has a gambling addiction; family finances were repeatedly destabilized and Vera has been managing the household largely alone while dealing with the stress. Conflict between Finn and Markus became physical on one occasion (Markus pushed Finn during an argument about money); Jugendamt intervened following a report from Finn's school. Finn's two younger siblings (Luca, 12; Emilia, 9) remain at home. Academic situation: Finn attends a Mittelschule in Giesing. His grades declined significantly in the last school year – from average Cs to failing marks in three subjects (German, English, Math). Two unexplained absences per week on average in the last semester. Teachers report he is withdrawn, occasionally disruptive in class, and has had two physical altercations with classmates. Finn presents as guarded and initially reluctant to engage. He has little trust in authority figures ('you're all the same as the Jugendamt'). Strengths identified: a history teacher noted that Finn shows genuine interest in history and geography; he is reportedly articulate and thoughtful when he chooses to engage. He has one close friend (David) from primary school who lives nearby.",
                        "metadata": {"category": "Initial Assessment"}
                    },
                    {
                        "source": "text",
                        "normalized": "Counseling Session – Second meeting with Finn at the Wohngruppe. He was less hostile than the first meeting, though still reserved. I asked about his interests rather than jumping to 'problems' – he talked about history, specifically the Second World War and post-war Germany. Knowledgeable and clearly enjoys the subject. Used this as an entry point to build rapport. He said school is 'pointless' and that teachers 'don't actually care.' Explored this further: Finn feels invisible at school. His decline in grades has led to negative feedback from teachers which he interprets as confirmation that he is 'stupid'. This is clearly not the case – his verbal reasoning and articulation are strong. He likely has significant unresolved emotional distress that is impacting his ability to concentrate and engage. Asked about his family: Finn said he misses his mother and siblings. He describes his mother Vera as 'doing her best' but overwhelmed. He has limited contact with his father Markus at the moment by his own preference: 'I don't want to talk to him until he sorts himself out.' Finn has not been told explicitly whether Markus is receiving treatment for his gambling addiction. Coordination needed with Jugendamt: clarify what family support is in place and what the reunification plan looks like. Finn should be involved in these plans in an age-appropriate way. He feels things are 'being decided about me without me.'",
                        "metadata": {"category": "Counseling"}
                    },
                    {
                        "source": "text",
                        "normalized": "School Liaison Visit – Met with Finn's class teacher (Frau Brenner) and school social worker (Herr Wagner) at the Mittelschule. Significant insights: Finn's attendance has improved since moving to the Wohngruppe (structure and morning routine helps). Grades still struggling but Frau Brenner noted 'small signs of effort' in the last few weeks. The two physical incidents with classmates: one was a reaction to being mocked about his living situation by another student – he overheard someone say 'he's in a home because his dad beats him'. Frau Brenner was not previously aware of this trigger. The second incident was a reaction to perceived disrespect. Finn responds to feeling humiliated with physical aggression. This is a pattern worth addressing in counseling. School support plan agreed: (1) Weekly check-in with school social worker Herr Wagner, (2) Access to study support after school (Hausaufgabenbetreuung) on Tuesdays and Thursdays, (3) Explicit instruction to teachers not to single Finn out negatively in class. Finn's history teacher (Herr Stein) has offered to give Finn a book on post-war German history that he thinks Finn would enjoy – a small but meaningful gesture. Need to follow up with Jugendamt on family situation and reunification planning. Vera (mother) has requested more frequent telephone contact with Finn – currently once a week. Wohngruppe staff have agreed to increase to twice weekly.",
                        "metadata": {"category": "School Visit"}
                    },
                    {
                        "source": "text",
                        "normalized": "Follow-up – Monthly review with Finn. He seems slightly more settled. He mentioned the history book from Herr Stein – has read half of it and found it 'actually interesting'. Small but real engagement with a positive authority figure. School: attendance is now regular (2 absences in last month, both illness-related and documented). Grades: failed the last Math test but passed German and English tests. Moving in the right direction. The study support (Hausaufgabenbetreuung) is helping – Finn says he finds it easier to concentrate when someone is nearby. Physical incidents: none in the last 6 weeks. Finn and I worked on the pattern of responding to perceived humiliation with aggression. He is beginning to articulate alternative responses: 'walk away, tell Herr Wagner, don't let them see it bothers me.' Not yet consistent but awareness is growing. Family update: Vera visited the Wohngruppe twice this month. Finn described these visits as 'okay' – there was obvious warmth. Emilia drew him a picture which he has pinned above his bed. Markus: Jugendamt confirmed that Markus is attending a Beratungsstelle for gambling addiction. He has had two sessions. Progress is early and fragile. Finn was informed that his father is seeking help – he was quiet for a moment then said 'good, he should.' He has not requested contact with Markus yet. Reunification: Jugendamt has set a 6-month review in 2 months to assess whether a gradual return home is possible. Key conditions: Markus must demonstrate sustained engagement with addiction counseling, household stability, and Finn must be willing. Currently premature to plan specifics.",
                        "metadata": {"category": "Follow-up"}
                    },
                    {
                        "source": "text",
                        "normalized": "Progress Note – 6-month review milestone. Finn has been in the Wohngruppe for 6 months. Overall assessment: meaningful progress, cautious optimism. Academic: Finn passed all his end-of-term assessments in the last school period (grades still weak but no failures). The school social worker describes him as 'present and engaged' most days. He has expressed interest in a Praktikum (work placement) at a local history museum in the next school year. School is supporting this application. Social development: Finn's relationship with two of the other residents in the Wohngruppe has improved. He and another resident (Jonas, 17) often watch football together. His friendship with David (from primary school) has been maintained through regular contact. Family situation: Markus has been attending gambling addiction counseling consistently for 3 months. Vera has engaged with a family counseling service. The family home dynamic, while not resolved, has improved. Finn has agreed to try a 'getting to know you' session with his father at the Beratungsstelle with a mediator present – he framed this as 'for my mum and the kids, not for him.' This ambivalent but engaged stance is developmentally appropriate for a 16-year-old in this situation. Reunification plan: Jugendamt has proposed a gradual model – weekend home visits starting next month, moving toward 50/50 arrangement by spring, with full return home assessed after 3 months of weekend visits if stable. Finn is cautiously open to this. He said: 'I miss my room.' Protective factors: Finn's resilience, his engagement with supportive adults (Herr Stein, Herr Wagner, Wohngruppe team), maintained friendship, and his mother's consistent presence.",
                        "metadata": {"category": "Progress Note"}
                    }
                ]
            }
        ]
        
        all_notes = []
        for case_group in notes_data:
            case = cases[case_group["case_index"]]
            for note_data in case_group["notes"]:
                note = Note(
                    case_id=case.id,
                    source=note_data["source"],
                    raw_content=note_data["normalized"],
                    normalized=note_data["normalized"],
                    processing_status="completed"
                )
                note.set_metadata(note_data.get("metadata", {}))
                session.add(note)
                all_notes.append(note)
        
        session.commit()
        print(f"✅ Created {len(all_notes)} demo notes")
        
        # Create tasks for cases
        tasks_data = [
            # Case 0: Emma Schreiber
            {
                "case_index": 0,
                "tasks": [
                    {
                        "title": "Follow up on Bürgergeld application status",
                        "description": "Contact Jobcenter to confirm payment date and amount; ensure Wohngeld is also active",
                        "priority": "high",
                        "due_date": datetime.now(timezone.utc) + timedelta(days=3)
                    },
                    {
                        "title": "Coordinate repayment agreement with landlord",
                        "description": "Assist Emma in drafting or reviewing written Ratenzahlung agreement for rent arrears",
                        "priority": "high",
                        "due_date": datetime.now(timezone.utc) + timedelta(days=5)
                    },
                    {
                        "title": "Refer to Familienzentrum counseling",
                        "description": "Submit referral to Familienzentrum Neuhausen for individual counseling and parenting support group",
                        "priority": "medium",
                        "due_date": datetime.now(timezone.utc) + timedelta(days=10)
                    }
                ]
            },
            # Case 1: Klaus Hoffmann
            {
                "case_index": 1,
                "tasks": [
                    {
                        "title": "Confirm grab bar installation appointment",
                        "description": "Follow up with Pflegekasse and installer to confirm bathroom safety equipment is scheduled",
                        "priority": "high",
                        "due_date": datetime.now(timezone.utc) + timedelta(days=4)
                    },
                    {
                        "title": "Arrange Hausnotruf device",
                        "description": "Discuss emergency call button with Klaus and request device through Pflegekasse if he agrees",
                        "priority": "medium",
                        "due_date": datetime.now(timezone.utc) + timedelta(days=14)
                    },
                    {
                        "title": "Monthly check-in call with Christine",
                        "description": "Coordinate monthly call between Klaus's daughter Christine and social worker to maintain family communication",
                        "priority": "medium",
                        "due_date": datetime.now(timezone.utc) + timedelta(days=21)
                    }
                ]
            },
            # Case 2: Layla Nassir
            {
                "case_index": 2,
                "tasks": [
                    {
                        "title": "Confirm Ausbildung enrollment documents",
                        "description": "Verify all enrollment paperwork submitted to Berufsfachschule für Pflege; check training salary setup",
                        "priority": "high",
                        "due_date": datetime.now(timezone.utc) + timedelta(days=7)
                    },
                    {
                        "title": "Schedule 2nd Refugio counseling appointment",
                        "description": "Confirm Layla has booked follow-up psychological counseling session at Refugio München",
                        "priority": "medium",
                        "due_date": datetime.now(timezone.utc) + timedelta(days=10)
                    }
                ]
            },
            # Case 3: Tobias Bergmann
            {
                "case_index": 3,
                "tasks": [
                    {
                        "title": "Obtain sobriety documentation from Fachambulanz",
                        "description": "Request formal progress report from Fachambulanz Sucht for submission to family court",
                        "priority": "high",
                        "due_date": datetime.now(timezone.utc) + timedelta(days=5)
                    },
                    {
                        "title": "Prepare court documentation package",
                        "description": "Compile employment contract, sobriety records, visit log, and housing documentation for Familiengericht review hearing",
                        "priority": "high",
                        "due_date": datetime.now(timezone.utc) + timedelta(days=14)
                    },
                    {
                        "title": "10-month sobriety milestone check-in",
                        "description": "Acknowledge milestone with Tobias; review relapse prevention plan and assess emotional state",
                        "priority": "medium",
                        "due_date": datetime.now(timezone.utc) + timedelta(days=3)
                    }
                ]
            },
            # Case 4: Sophie Richter
            {
                "case_index": 4,
                "tasks": [
                    {
                        "title": "Confirm Betreutes Wohnen move-in details",
                        "description": "Verify move-in date, room assignment, and support schedule with Caritas Wohnhilfe",
                        "priority": "high",
                        "due_date": datetime.now(timezone.utc) + timedelta(days=3)
                    },
                    {
                        "title": "Explore Zuverdienst work reintegration program",
                        "description": "Contact Jobcenter Eingliederungshilfe to request information about supported work placement for mental health rehabilitation",
                        "priority": "medium",
                        "due_date": datetime.now(timezone.utc) + timedelta(days=14)
                    }
                ]
            },
            # Case 5: Finn Kowalski
            {
                "case_index": 5,
                "tasks": [
                    {
                        "title": "Prepare for Jugendamt 6-month review meeting",
                        "description": "Compile documentation of academic progress, behavioral development, family contact records, and Finn's stated preferences for review hearing",
                        "priority": "high",
                        "due_date": datetime.now(timezone.utc) + timedelta(days=7)
                    },
                    {
                        "title": "Coordinate museum Praktikum application",
                        "description": "Support Finn's application for work placement at local history museum; liaise with school and museum contact",
                        "priority": "medium",
                        "due_date": datetime.now(timezone.utc) + timedelta(days=21)
                    }
                ]
            }
        ]
        
        all_tasks = []
        for task_group in tasks_data:
            case = cases[task_group["case_index"]]
            for task_data in task_group["tasks"]:
                task = Task(
                    case_id=case.id,
                    title=task_data["title"],
                    description=task_data.get("description"),
                    priority=task_data.get("priority", "medium"),
                    status="open",
                    due_date=task_data.get("due_date")
                )
                session.add(task)
                all_tasks.append(task)
        
        session.commit()
        print(f"✅ Created {len(all_tasks)} demo tasks")
        
        # Create help plans for cases
        help_plans_data = [
            {
                "case_index": 0,
                "content": {
                    "period": "January 2025 – June 2025",
                    "goals": [
                        "Secure stable housing and prevent eviction",
                        "Achieve financial stability through full benefit entitlements",
                        "Reduce psychological stress and improve Emma's mental health",
                        "Maintain children's well-being, school attendance, and daily routine"
                    ],
                    "actions": [
                        "Finalize Bürgergeld application and monitor approval timeline",
                        "Negotiate written repayment agreement with landlord for rent arrears",
                        "Submit Unterhaltsvorschuss application and pursue child support from Thomas",
                        "Attend Caritas budgeting workshop and implement monthly budget plan",
                        "Engage with Familienzentrum Neuhausen for parenting support and individual counseling"
                    ],
                    "risks": [
                        "Eviction proceedings could displace the family before benefits clear",
                        "Financial stress is contributing to anxiety and disrupted parenting",
                        "Unpaid rent arrears may accumulate further if repayment plan not agreed quickly"
                    ],
                    "protectiveFactors": [
                        "Emma is motivated, engaged, and takes action on advice given",
                        "Both children are doing well in school and Kita",
                        "Informal support from neighbor Maria provides childcare buffer",
                        "Emma has stable part-time employment"
                    ],
                    "summary": "Emma Schreiber is a single mother of two facing acute housing instability and financial difficulties following separation. Immediate priorities are preventing eviction and securing full benefit entitlements (Bürgergeld, Wohngeld, Unterhaltsvorschuss). Emma is cooperative and engaged; her children are stable. With financial pressure reducing, the medium-term focus shifts to mental health support and long-term income improvement as Mia approaches school age."
                }
            },
            {
                "case_index": 1,
                "content": {
                    "period": "January 2025 – July 2025",
                    "goals": [
                        "Maintain Klaus's independence in his own home",
                        "Ensure consistent medication management and health monitoring",
                        "Reduce fall risk through home safety improvements",
                        "Address social isolation and grief through structured social activity"
                    ],
                    "actions": [
                        "Complete installation of bathroom grab bars and additional stair handrail",
                        "Maintain weekly pill organizer routine with GP monitoring",
                        "Establish Essen auf Rädern delivery 4 days per week for nutritional support",
                        "Support ongoing attendance at chess group at Seniorenzentrum",
                        "Introduce Hausnotruf emergency call device (requires Klaus's agreement)",
                        "Monthly coordination call with daughter Christine"
                    ],
                    "risks": [
                        "Undetected fall risk in bathroom – mitigation underway but not yet complete",
                        "Social isolation and unprocessed grief may worsen as winter progresses",
                        "Medication non-adherence could recur without consistent structure"
                    ],
                    "protectiveFactors": [
                        "Klaus is cognitively intact and motivated to maintain independence",
                        "Daughter Christine is engaged and willing to support",
                        "Good relationship with GP and established medical care",
                        "Successful re-engagement with chess group shows social capacity"
                    ],
                    "summary": "Klaus Hoffmann is a 71-year-old widower living independently in Munich. His primary risks are medication non-adherence, fall hazards in the home, and social isolation following the death of his wife. Significant progress has been made: pill organizer in consistent use, meals on wheels established, chess group re-engaged, and safety modifications underway. Focus over the next months is on consolidating these gains, introducing emergency safety technology, and addressing grief through meaningful social connection."
                }
            },
            {
                "case_index": 2,
                "content": {
                    "period": "January 2025 – September 2025",
                    "goals": [
                        "Secure residence permit renewal and long-term legal stability",
                        "Complete B2 German language certification",
                        "Begin nursing Ausbildung (vocational training) in September",
                        "Address trauma and emotional wellbeing through professional counseling"
                    ],
                    "actions": [
                        "Complete intensive B2 German course at VHS München",
                        "Obtain formal recognition of Syrian school certificate through Bildungsberatung",
                        "Complete 2-week nursing Praktikum placement",
                        "Enroll and start Pflegeausbildung at Berufsfachschule für Pflege München",
                        "Continue psychological counseling sessions at Refugio München",
                        "Apply for Bürgergeld transition to training salary upon Ausbildung start"
                    ],
                    "risks": [
                        "Language gap (B1→B2) is the critical bottleneck for Ausbildung eligibility",
                        "Psychological burden of family separation and trauma may affect concentration and progress",
                        "Residence permit timeline is tight – any delays in language progress could affect renewal"
                    ],
                    "protectiveFactors": [
                        "Layla is highly motivated, disciplined, and demonstrates rapid learning",
                        "Strong family support through sister Nour",
                        "Syrian school certificate recognized as equivalent – removes a significant barrier",
                        "Nursing sector has strong demand, increasing likelihood of successful Ausbildung completion and employment"
                    ],
                    "summary": "Layla Nassir is a 22-year-old Syrian refugee with strong educational background and high motivation to integrate and build an independent life. Her pathway to a nursing Ausbildung is well-defined and largely on track. The key risk areas are the B1-to-B2 language gap and unprocessed emotional distress from family separation. Both are being actively addressed. Once the Ausbildung begins in September, Layla will have financial independence and a clear professional trajectory."
                }
            },
            {
                "case_index": 3,
                "content": {
                    "period": "January 2025 – July 2025",
                    "goals": [
                        "Maintain and strengthen sobriety through structured recovery support",
                        "Improve custody arrangement progressively toward unsupervised visits",
                        "Achieve long-term employment stability",
                        "Rebuild the father-daughter relationship with Lena at a healthy pace"
                    ],
                    "actions": [
                        "Continue weekly Fachambulanz Sucht counseling and twice-weekly AA attendance",
                        "Obtain formal sobriety documentation for family court proceedings",
                        "Engage Beratungsstelle family law consultation to strengthen legal representation",
                        "Attend all supervised visitation sessions consistently and document each visit",
                        "Transition to permanent employment contract (in progress)",
                        "Maintain sobriety journal and sponsor contact as relapse prevention"
                    ],
                    "risks": [
                        "Custody dispute outcome is uncertain and emotionally high-stakes – risk of relapse under stress",
                        "Sabine's opposition to progress may undermine Tobias's confidence and motivation",
                        "Without legal representation, Tobias was vulnerable in court proceedings"
                    ],
                    "protectiveFactors": [
                        "8+ months sustained sobriety with consistent treatment engagement",
                        "Strong AA support network including trusted sponsor",
                        "Stable housing and emerging employment stability",
                        "Tobias shows genuine insight, remorse, and commitment to change",
                        "Lena showing signs of warming to contact"
                    ],
                    "summary": "Tobias Bergmann is 11 months into alcohol recovery following years of dependence that contributed to divorce and loss of contact with his daughter. His sobriety is stable and well-supported. The current focus is on strengthening the legal case for improved custody arrangements, maintaining recovery under emotional stress, and building a sustainable, trust-based relationship with Lena. Permanent employment will provide a crucial additional stability factor."
                }
            },
            {
                "case_index": 4,
                "content": {
                    "period": "January 2025 – June 2025",
                    "goals": [
                        "Secure stable transitional housing through Betreutes Wohnen",
                        "Maintain mental health gains from Tagesklinik treatment",
                        "Gradually rebuild social connections and daily structure",
                        "Begin exploring pathway back to employment or creative work"
                    ],
                    "actions": [
                        "Coordinate move into Caritas Betreutes Wohnen in Schwabing",
                        "Continue psychiatric treatment and medication management",
                        "Attend Tagesklinik alumni network group monthly",
                        "Explore Zuverdienst supported work placement program at Jobcenter",
                        "Engage in low-pressure freelance creative projects as confidence-building bridge",
                        "Maintain structured daily routine: regular sleep, outdoor activity, limited social media"
                    ],
                    "risks": [
                        "Housing transition may temporarily disrupt mental health stability",
                        "Social isolation is the primary ongoing risk for depressive relapse",
                        "Pressure to return to work too quickly could overwhelm fragile recovery"
                    ],
                    "protectiveFactors": [
                        "Sophie engages well with treatment and follows recommendations consistently",
                        "Good self-awareness of her condition and its triggers",
                        "Medication is stable and effective",
                        "Creative skills provide a meaningful pathway back to engagement"
                    ],
                    "summary": "Sophie Richter is a 27-year-old in recovery from major depressive disorder following a workplace-related crisis. She completed a partial hospitalization program and has maintained her mental health routine. The immediate priority is stable housing through Betreutes Wohnen, which resolves the acute crisis. Medium-term goals focus on rebuilding social connection and a supported, gradual return to creative work and eventually employment. Sophie's self-awareness and treatment engagement are significant protective factors."
                }
            },
            {
                "case_index": 5,
                "content": {
                    "period": "January 2025 – July 2025",
                    "goals": [
                        "Stabilize Finn in the Wohngruppe with improving school engagement",
                        "Reduce physical aggression incidents through emotional regulation skills",
                        "Maintain and strengthen contact with mother Vera and siblings",
                        "Prepare for gradual, safe transition toward family reunification if conditions are met"
                    ],
                    "actions": [
                        "Weekly check-in sessions with Finn focused on emotional regulation and school progress",
                        "Coordinate with school social worker Herr Wagner on attendance and behavioral support",
                        "Liaise with Jugendamt on 6-month reunification review and document all evidence",
                        "Support family contact visits with Vera and siblings (twice-weekly phone contact)",
                        "Facilitate supervised introduction session between Finn and Markus at Beratungsstelle",
                        "Support museum Praktikum application as engagement and confidence-building initiative"
                    ],
                    "risks": [
                        "Premature reunification without Markus demonstrating sustained recovery could re-traumatize Finn",
                        "Finn's low self-esteem and academic difficulties may worsen without continued support",
                        "Physical aggression pattern could escalate if emotional regulation skills not reinforced"
                    ],
                    "protectiveFactors": [
                        "Finn has genuine resilience and cognitive capacity",
                        "Positive relationships with Herr Stein, Herr Wagner, and Wohngruppe team",
                        "Warm relationship with mother Vera and evident care for siblings",
                        "Markus is engaging with addiction counseling",
                        "Stable social connection with friend David"
                    ],
                    "summary": "Finn Kowalski is a 16-year-old in residential care following family conflict rooted in his father's gambling addiction. Meaningful progress has been made in school engagement, behavioral management, and family contact. The 6-month Jugendamt review is approaching, and a gradual reunification model is being considered pending sustained improvement in home conditions. The priority is ensuring any return home is safe and planned, not rushed, and that Finn continues to develop the emotional skills to navigate family complexity."
                }
            }
        ]
        
        all_help_plans = []
        for plan_data in help_plans_data:
            case = cases[plan_data["case_index"]]
            help_plan = HelpPlanDraft(
                case_id=case.id,
                version=1,
                is_current=True
            )
            help_plan.set_content(plan_data["content"])
            session.add(help_plan)
            all_help_plans.append(help_plan)
        
        session.commit()
        print(f"✅ Created {len(all_help_plans)} demo help plans")
        
        # Create some insights
        insights_data = [
            {
                "case_index": 0,
                "insights": [
                    {
                        "type": "risk",
                        "title": "Acute Eviction Risk",
                        "severity": "high",
                        "content": {
                            "analysis": "Emma Schreiber faces a high risk of eviction following a formal Räumungsklage (eviction lawsuit) from her landlord. Three months of rent arrears (€2,400) remain partially unresolved despite an emergency Wohnungsamt payment of €800. A written repayment plan is in place but has not yet been fully executed. The timeline gap between benefit approvals (Bürgergeld) and outstanding debt creates a window of acute vulnerability. Children's housing stability is directly dependent on resolving this within the next 30–60 days."
                        }
                    },
                    {
                        "type": "pattern",
                        "title": "Benefit Entitlement Gap Pattern",
                        "content": {
                            "analysis": "A consistent pattern across notes is Emma's lack of awareness of available benefit entitlements. She was unaware of Unterhaltsvorschuss until the second session. Wohngeld had been pending for 11 weeks without follow-up. Bürgergeld was not applied for due to stigma. This pattern suggests that benefit access is being delayed by knowledge barriers and shame rather than eligibility issues. Proactive benefit mapping at initial intake could have shortened the crisis period significantly. Worth noting for case management process improvement."
                        }
                    }
                ]
            },
            {
                "case_index": 1,
                "insights": [
                    {
                        "type": "risk",
                        "title": "Fall Risk and Home Safety",
                        "severity": "medium",
                        "content": {
                            "analysis": "Klaus Hoffmann disclosed a bathroom slip two months ago that he did not report to his GP or daughter. He manages stairs by gripping the wall rather than a handrail on one side. Grab bars are ordered but not yet installed. Given his age (71), mobility limitations (bilateral osteoarthritis), and living alone without emergency contact system, a fall resulting in an injury could have serious consequences. This risk is actively being mitigated but installation must be confirmed and an emergency call device (Hausnotruf) introduced."
                        }
                    },
                    {
                        "type": "pattern",
                        "title": "Grief-Driven Isolation Pattern",
                        "content": {
                            "analysis": "Klaus's withdrawal from the chess group and reduction in social activity are directly linked to his wife Helga's death two years ago. He described continuing social activities as feeling 'wrong' — a classic guilt response in bereavement. His nutrition has deteriorated (skipping meals), apartment feels sparse, and his daily routine has contracted significantly. The positive response to re-engaging with the chess group (stayed 3 hours, planning to return) suggests strong latent social capacity. Structured social reintegration, rather than clinical intervention, appears to be the most appropriate pathway for addressing the grief-isolation pattern."
                        }
                    }
                ]
            },
            {
                "case_index": 2,
                "insights": [
                    {
                        "type": "risk",
                        "title": "Residence Permit Renewal Timeline Risk",
                        "severity": "high",
                        "content": {
                            "analysis": "Layla Nassir's Aufenthaltserlaubnis was valid for 18 months and had 7 months remaining at initial assessment. The renewal required demonstrated integration progress and either employment or enrollment in a recognized program. The B1→B2 language gap was the primary bottleneck: without B2 certification, she could not enroll in the Pflegeausbildung, and without enrollment, the permit renewal was at risk. The intensive VHS course was the critical intervention. Permit has now been extended, but the case illustrates how tightly coupled language progress, vocational eligibility, and legal status are for refugees in this cohort."
                        }
                    },
                    {
                        "type": "pattern",
                        "title": "Internalized Pressure and Deferred Emotional Processing",
                        "content": {
                            "analysis": "Across multiple notes, Layla minimizes her emotional distress and frames herself as a burden to others ('I don't want to always need help'). She quickly composed herself after receiving a worrying message from her family in Aleppo and rarely discusses the situation directly. She initially dismissed the referral to Refugio München. This pattern of deferring her own emotional needs in favor of practical progress is common in refugee clients with high external pressure. It is also a risk factor: suppressed distress may surface as concentration difficulties or crisis during the demanding Ausbildung period. Continued psychological support should remain part of the plan even once vocational integration is stable."
                        }
                    }
                ]
            },
            {
                "case_index": 3,
                "insights": [
                    {
                        "type": "risk",
                        "title": "Relapse Risk Under Legal Stress",
                        "severity": "high",
                        "content": {
                            "analysis": "Tobias Bergmann is under sustained emotional stress from the custody dispute. The receipt of Sabine's lawyer's letter requesting reduced visits caused visible distress. Research on alcohol use disorder recovery consistently identifies relationship and custody conflict as a significant relapse trigger, particularly for male clients with a history of using alcohol to manage emotional overwhelm. Tobias has strong protective structures (Fachambulanz, AA, sponsor) but these must remain fully active during the court proceedings period. Any gaps in structured support should be flagged immediately."
                        }
                    },
                    {
                        "type": "pattern",
                        "title": "Consistent Recovery Engagement Pattern",
                        "content": {
                            "analysis": "Tobias has demonstrated consistent engagement with every element of his recovery and reintegration plan over 11 months: weekly Fachambulanz counseling, twice-weekly AA attendance, sponsor contact, new social activity (volleyball), and consistent documentation of visits with Lena. This consistent pattern is a strong prognostic indicator. The contrast between his past behavior (missed work, driving intoxicated, physical conflict with son) and current behavior is significant. Courts and custody evaluators typically weight consistency of behavior over time heavily. This pattern should be explicitly documented and presented in the Familiengericht proceedings."
                        }
                    }
                ]
            },
            {
                "case_index": 4,
                "insights": [
                    {
                        "type": "risk",
                        "title": "Social Isolation as Relapse Risk",
                        "severity": "medium",
                        "content": {
                            "analysis": "Sophie Richter's primary ongoing risk factor for depressive relapse is social isolation. Her social network is extremely limited (one close friend in Berlin, strained relationship with parents). The Tagesklinik alumni group is a weak tie and she found her first session exhausting. The transition to Betreutes Wohnen introduces new social proximity but also the stress of living with strangers. Monitoring social connection levels — not just mood symptoms — is critical during the post-discharge period. Historical literature on MDD recovery identifies social isolation as one of the strongest predictors of relapse within 12 months of discharge."
                        }
                    },
                    {
                        "type": "pattern",
                        "title": "Help-Seeking Inhibited by Shame",
                        "content": {
                            "analysis": "Sophie has consistently delayed or resisted seeking help due to shame and stigma. She did not approach any official housing support channels before the session, describing feeling 'embarrassed'. She herself connected this to her depression: 'When I'm low, everything feels like too much effort and asking for help feels humiliating.' This shame-inhibited help-seeking pattern likely extended the duration of her pre-hospitalization crisis. Now that she is more stable, building her confidence in navigating support systems as a normal and empowered activity — rather than evidence of failure — should be an explicit therapeutic goal."
                        }
                    }
                ]
            },
            {
                "case_index": 5,
                "insights": [
                    {
                        "type": "risk",
                        "title": "Premature Reunification Risk",
                        "severity": "medium",
                        "content": {
                            "analysis": "The upcoming Jugendamt 6-month review will assess suitability for beginning a gradual return home. Markus Kowalski has attended only two gambling addiction counseling sessions — early and fragile engagement. If reunification is approved too quickly, Finn may be returned to a home environment where the root cause of family conflict (Markus's addiction and associated financial instability) has not been genuinely resolved. Finn himself is not ready to re-engage with his father. The Jugendamt model of weekend visits starting next month is reasonable in principle, but should be contingent on Markus demonstrating at least 3 months of consistent counseling attendance before unsupervised home contact is permitted."
                        }
                    },
                    {
                        "type": "pattern",
                        "title": "Shame-Triggered Aggression Pattern",
                        "content": {
                            "analysis": "Analysis of Finn's two physical incidents at school reveals a consistent trigger: perceived public humiliation. The first incident was a direct response to overhearing a classmate mock his residential care placement. The second was described as a reaction to 'disrespect'. Finn does not appear to initiate aggression proactively. His responses are defensive and related to his sense of dignity and self-worth, which are fragile given the family context and the stigma of being in a Wohngruppe. Emotional regulation work should focus specifically on humiliation tolerance and non-physical responses to perceived disrespect, rather than generic anger management."
                        }
                    }
                ]
            }
        ]
        
        all_insights = []
        for insight_group in insights_data:
            case = cases[insight_group["case_index"]]
            for insight_data in insight_group["insights"]:
                insight = Insight(
                    case_id=case.id,
                    type=insight_data["type"],
                    title=insight_data["title"],
                    severity=insight_data.get("severity"),
                    is_read=False
                )
                insight.set_content(insight_data["content"])
                session.add(insight)
                all_insights.append(insight)
        
        session.commit()
        print(f"✅ Created {len(all_insights)} demo insights")
        
        print(f"\n🎉 Demo data creation complete!")
        print(f"   Cases: {len(cases)}")
        print(f"   Notes: {len(all_notes)}")
        print(f"   Tasks: {len(all_tasks)}")
        print(f"   Help Plans: {len(all_help_plans)}")
        print(f"   Insights: {len(all_insights)}")


if __name__ == "__main__":
    create_demo_data()

