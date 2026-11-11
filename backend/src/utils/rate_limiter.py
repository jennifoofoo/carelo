"""Rate limiting utilities using Redis."""
import time
from typing import Optional
from fastapi import HTTPException, status
from src.utils.redis_cache import get_redis_client


class RateLimiter:
    """Rate limiter using Redis."""
    
    def __init__(self, redis_client=None):
        self.redis = redis_client or get_redis_client()
    
    def is_allowed(
        self,
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> bool:
        """
        Check if request is allowed based on rate limit.
        
        Args:
            key: Unique identifier for the rate limit (e.g., user_id, ip_address)
            max_requests: Maximum number of requests allowed
            window_seconds: Time window in seconds
            
        Returns:
            True if request is allowed, False otherwise
        """
        if not self.redis:
            # Redis not available, allow request
            return True
        
        try:
            # Use sliding window log algorithm
            now = time.time()
            window_start = now - window_seconds
            
            # Get current requests in window
            pipe = self.redis.pipeline()
            pipe.zremrangebyscore(key, 0, window_start)  # Remove old entries
            pipe.zcard(key)  # Count current entries
            pipe.zadd(key, {str(now): now})  # Add current request
            pipe.expire(key, window_seconds)  # Set expiry
            results = pipe.execute()
            
            current_count = results[1]
            
            return current_count < max_requests
        except Exception as e:
            print(f"⚠️  Rate limiter error: {e}")
            # On error, allow request (fail open)
            return True
    
    def get_remaining(
        self,
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> int:
        """Get remaining requests in current window."""
        if not self.redis:
            return max_requests
        
        try:
            now = time.time()
            window_start = now - window_seconds
            
            # Remove old entries and count
            self.redis.zremrangebyscore(key, 0, window_start)
            current_count = self.redis.zcard(key)
            
            return max(0, max_requests - current_count)
        except Exception as e:
            print(f"⚠️  Rate limiter error: {e}")
            return max_requests
    
    def get_reset_time(
        self,
        key: str,
        window_seconds: int
    ) -> Optional[float]:
        """Get time when rate limit resets."""
        if not self.redis:
            return None
        
        try:
            ttl = self.redis.ttl(key)
            if ttl > 0:
                return time.time() + ttl
            return time.time() + window_seconds
        except Exception as e:
            print(f"⚠️  Rate limiter error: {e}")
            return None


# Global rate limiter instance
_rate_limiter = None


def get_rate_limiter() -> RateLimiter:
    """Get global rate limiter instance."""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter


def rate_limit(
    max_requests: int = 10,
    window_seconds: int = 60,
    key_func: Optional[callable] = None
):
    """
    Decorator for rate limiting FastAPI endpoints.
    
    Args:
        max_requests: Maximum requests per window
        window_seconds: Time window in seconds
        key_func: Function to generate rate limit key (default: uses request client IP)
    """
    def decorator(func):
        from fastapi import Request
        import inspect
        from functools import wraps
        
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Find Request object in args/kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            if not request:
                # Try to get from kwargs with different possible names
                request = kwargs.get('request') or kwargs.get('http_request')
            
            # Generate rate limit key
            if key_func:
                key = key_func(request, *args, **kwargs)
            else:
                # Default: use client IP or user ID
                user_id = None
                # Try to get user ID from args/kwargs first (more reliable)
                for arg in args:
                    if hasattr(arg, 'id') and hasattr(arg, 'email'):  # User object
                        user_id = arg.id
                        break
                if not user_id:
                    # Try from kwargs
                    user_obj = kwargs.get('current_user')
                    if user_obj and hasattr(user_obj, 'id'):
                        user_id = user_obj.id
                
                if user_id:
                    key = f"rate_limit:{func.__name__}:user:{user_id}"
                elif request:
                    client_ip = request.client.host if request.client else "unknown"
                    key = f"rate_limit:{func.__name__}:ip:{client_ip}"
                else:
                    key = f"rate_limit:{func.__name__}:unknown"
            
            limiter = get_rate_limiter()
            
            if not limiter.is_allowed(key, max_requests, window_seconds):
                remaining = limiter.get_remaining(key, max_requests, window_seconds)
                reset_time = limiter.get_reset_time(key, window_seconds)
                
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "Rate limit exceeded",
                        "message": f"Too many requests. Please try again later.",
                        "remaining": remaining,
                        "reset_at": reset_time
                    }
                )
            
            return await func(*args, **kwargs)
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # For sync functions, just call them (rate limiting only for async)
            return func(*args, **kwargs)
        
        # Return appropriate wrapper
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

