from sqlalchemy.orm import Session
from models import AutomatonRule, Order, PaymentStatus, InventoryStatus

TERMINAL_STATES = {"Cancelled", "Refunded"}

def get_next_state(db: Session, current_state: str, action: str, order: Order = None):
    """
    Returns (next_state, error_message, transition_description).
    Checks dynamic DFA transitions from the automaton_rules table.
    Multi-Automata state (Payment, Inventory) is synced automatically.
    """
    rule = db.query(AutomatonRule).filter(
        AutomatonRule.source_state == current_state,
        AutomatonRule.action == action
    ).first()

    if not rule:
        return None, f"Invalid transition: Cannot perform '{action}' from state '{current_state}'. No DFA rule found.", None

    next_state = rule.target_state

    # Auto-sync sub-automata on state entry
    if order:
        if next_state == "Processing":
            order.payment_status = PaymentStatus.CAPTURED
            order.inventory_status = InventoryStatus.RESERVED
        elif next_state == "Shipped":
            order.inventory_status = InventoryStatus.CONSUMED
        elif next_state in ("Refunded", "Cancelled"):
            if order.payment_status == PaymentStatus.CAPTURED:
                order.payment_status = PaymentStatus.REFUNDED

    return next_state, None, rule.description


def get_available_actions(db: Session, current_state: str) -> list:
    """Returns valid actions for the current state."""
    rules = db.query(AutomatonRule).filter(AutomatonRule.source_state == current_state).all()
    return [{"action": r.action, "label": _action_label(r.action), "description": r.description} for r in rules]


def _action_label(action: str) -> str:
    labels = {
        "process":         "Process Order",
        "ship":            "Mark as Shipped",
        "deliver":         "Mark as Delivered",
        "cancel":          "Cancel Order",
        "return_request":  "Initiate Return",
        "pickup":          "Return Picked Up",
        "refund":          "Issue Refund",
        "replace_request": "Initiate Replacement",
        "approve_replace": "Approve Replacement",
    }
    return labels.get(action, action.replace("_", " ").title())
