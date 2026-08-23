from typing import List, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import settings
from app.models.user import User, Role

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = await User.get(user_id)
    if user is None:
        raise credentials_exception
    return user

def require_role(allowed_roles: Union[Role, str, List[Union[Role, str]]]):
    if not isinstance(allowed_roles, (list, tuple, set)):
        roles_list = [allowed_roles]
    else:
        roles_list = list(allowed_roles)
    
    # Convert any strings to enum values if needed
    normalized_roles = [r.value if isinstance(r, Role) else str(r) for r in roles_list]

    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role.value if isinstance(current_user.role, Role) else str(current_user.role)
        if user_role not in normalized_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role '{user_role}'. Required: {normalized_roles}"
            )
        return current_user
    return role_checker