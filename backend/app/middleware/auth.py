import os
from typing import List, Union

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.models.user import User, Role


# Load environment variables
load_dotenv()

# JWT configuration
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:

    token = credentials.credentials

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )

        user_id = payload.get("sub")

        # Ensure user_id exists and is a string
        if not isinstance(user_id, str):
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = await User.get(user_id)

    if user is None:
        raise credentials_exception

    return user


def require_role(
    allowed_roles: Union[
        Role,
        str,
        List[Union[Role, str]]
    ]
):
    if not isinstance(
        allowed_roles,
        (list, tuple, set)
    ):
        roles_list = [allowed_roles]
    else:
        roles_list = list(allowed_roles)

    # Convert Role enums to strings
    normalized_roles = [
        role.value
        if isinstance(role, Role)
        else str(role)
        for role in roles_list
    ]

    async def role_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:

        user_role = (
            current_user.role.value
            if isinstance(current_user.role, Role)
            else str(current_user.role)
        )

        if user_role not in normalized_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Operation not permitted for role "
                    f"'{user_role}'. "
                    f"Required: {normalized_roles}"
                )
            )

        return current_user

    return role_checker