"""add account_status to users

Revision ID: h0c1e5g3h4d7
Revises: g9b0d4e2f3c6
Create Date: 2026-07-04

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'h0c1e5g3h4d7'
down_revision = 'g9b0d4e2f3c6'
depends_on = None


def upgrade():
    # Add account_status column with default 'active' for existing users
    op.add_column('users', sa.Column('account_status', sa.String(), nullable=False, server_default='active'))


def downgrade():
    op.drop_column('users', 'account_status')
