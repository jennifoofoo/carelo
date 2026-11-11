"""Redis caching utilities for backend."""
import json
import redis
from typing import Optional, Any, Callable
from functools import wraps
from datetime import timedelta
from src.config import settings

# Redis connection pool
_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> Optional[redis.Redis]:
    """Get or create Redis client."""
    global _redis_client
    
    if _redis_client is None:
        try:
            # Parse Redis URL
            redis_url = settings.REDIS_URL
            if redis_url.startswith("redis://"):
                # Extract password if present
                if "@" in redis_url:
                    # Format: redis://:password@host:port/db
                    parts = redis_url.replace("redis://", "").split("@")
                    if len(parts) == 2:
                        password = parts[0].replace(":", "")
                        host_port_db = parts[1]
                        host_port, db = host_port_db.split("/")
                        host, port = host_port.split(":")
                        _redis_client = redis.Redis(
                            host=host,
                            port=int(port),
                            db=int(db),
                            password=password,
                            decode_responses=True,
                            socket_connect_timeout=5,
                            socket_timeout=5,
                        )
                    else:
                        # No password
                        host_port_db = parts[0] if parts else redis_url.replace("redis://", "")
                        host_port, db = host_port_db.split("/")
                        host, port = host_port.split(":")
                        _redis_client = redis.Redis(
                            host=host,
                            port=int(port),
                            db=int(db),
                            decode_responses=True,
                            socket_connect_timeout=5,
                            socket_timeout=5,
                        )
                else:
                    # Simple format: redis://host:port/db
                    parts = redis_url.replace("redis://", "").split("/")
                    host_port = parts[0]
                    db = int(parts[1]) if len(parts) > 1 else 0
                    host, port = host_port.split(":")
                    _redis_client = redis.Redis(
                        host=host,
                        port=int(port),
                        db=db,
                        decode_responses=True,
                        socket_connect_timeout=5,
                        socket_timeout=5,
                    )
            else:
                # Fallback to localhost
                _redis_client = redis.Redis(
                    host="localhost",
                    port=6379,
                    db=0,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                )
            
            # Test connection
            _redis_client.ping()
            print("✅ Redis connected for caching")
        except Exception as e:
            print(f"⚠️  Redis not available for caching: {e}")
            _redis_client = None
    
    return _redis_client


def cache_key(prefix: str, *args, **kwargs) -> str:
    """Generate cache key from prefix and arguments."""
    key_parts = [prefix]
    if args:
        key_parts.extend(str(arg) for arg in args)
    if kwargs:
        key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
    return ":".join(key_parts)


def cached(ttl: int = 300, prefix: str = "cache"):
    """
    Decorator to cache function results in Redis.
    
    Args:
        ttl: Time to live in seconds (default: 5 minutes)
        prefix: Cache key prefix
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            redis_client = get_redis_client()
            if not redis_client:
                # Redis not available, just call function
                return await func(*args, **kwargs)
            
            # Generate cache key
            key = cache_key(prefix, func.__name__, *args, **kwargs)
            
            # Try to get from cache
            try:
                cached_value = redis_client.get(key)
                if cached_value:
                    return json.loads(cached_value)
            except Exception as e:
                print(f"⚠️  Cache read error: {e}")
            
            # Call function
            result = await func(*args, **kwargs)
            
            # Store in cache
            try:
                redis_client.setex(
                    key,
                    ttl,
                    json.dumps(result, default=str)
                )
            except Exception as e:
                print(f"⚠️  Cache write error: {e}")
            
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            redis_client = get_redis_client()
            if not redis_client:
                # Redis not available, just call function
                return func(*args, **kwargs)
            
            # Generate cache key
            key = cache_key(prefix, func.__name__, *args, **kwargs)
            
            # Try to get from cache
            try:
                cached_value = redis_client.get(key)
                if cached_value:
                    return json.loads(cached_value)
            except Exception as e:
                print(f"⚠️  Cache read error: {e}")
            
            # Call function
            result = func(*args, **kwargs)
            
            # Store in cache
            try:
                redis_client.setex(
                    key,
                    ttl,
                    json.dumps(result, default=str)
                )
            except Exception as e:
                print(f"⚠️  Cache write error: {e}")
            
            return result
        
        # Return appropriate wrapper based on function type
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


def invalidate_cache(pattern: str):
    """Invalidate cache entries matching pattern."""
    redis_client = get_redis_client()
    if not redis_client:
        return
    
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
            print(f"🗑️  Invalidated {len(keys)} cache entries: {pattern}")
    except Exception as e:
        print(f"⚠️  Cache invalidation error: {e}")


def get_cache(key: str) -> Optional[Any]:
    """Get value from cache."""
    redis_client = get_redis_client()
    if not redis_client:
        return None
    
    try:
        value = redis_client.get(key)
        if value:
            return json.loads(value)
    except Exception as e:
        print(f"⚠️  Cache get error: {e}")
    
    return None


def set_cache(key: str, value: Any, ttl: int = 300):
    """Set value in cache."""
    redis_client = get_redis_client()
    if not redis_client:
        return
    
    try:
        redis_client.setex(
            key,
            ttl,
            json.dumps(value, default=str)
        )
    except Exception as e:
        print(f"⚠️  Cache set error: {e}")

