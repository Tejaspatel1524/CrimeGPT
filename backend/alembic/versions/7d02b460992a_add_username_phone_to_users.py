"""add_username_phone_to_users

Revision ID: 7d02b460992a
Revises: enterprise_auth_001
Create Date: 2026-07-02 13:57:03.763801

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7d02b460992a'
down_revision: Union[str, Sequence[str], None] = 'enterprise_auth_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add username and phone columns to users table
    op.add_column('users', sa.Column('username', sa.String(), nullable=True))
    op.add_column('users', sa.Column('phone', sa.String(), nullable=True))
    
    # Create index on username for fast lookups
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop index and columns
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_column('users', 'phone')
    op.drop_column('users', 'username')
