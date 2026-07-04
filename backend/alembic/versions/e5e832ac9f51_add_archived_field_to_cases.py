"""add_archived_field_to_cases

Revision ID: e5e832ac9f51
Revises: 4f90354d3b04
Create Date: 2026-06-29 12:20:48.380049

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5e832ac9f51'
down_revision: Union[str, Sequence[str], None] = '4f90354d3b04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add archived column with default value 0 (not archived)
    op.add_column('cases', sa.Column('archived', sa.Integer(), nullable=False, server_default='0'))
    # Create index on archived for efficient filtering
    op.create_index(op.f('ix_cases_archived'), 'cases', ['archived'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop index first
    op.drop_index(op.f('ix_cases_archived'), table_name='cases')
    # Drop column
    op.drop_column('cases', 'archived')
