from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
# CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}})


# KFC menu
menu = {
    "Chicken": {
        "Original Recipe Chicken": 1.50,
        "Hot Wings": 5.00,
        "Zinger Burger": 4.00,
        "Chicken Sandwich": 3.50
    },
    "Combos": {
        "Bucket Meal": 15.00,
        "Family Meal": 25.00,
        "Zinger Combo": 8.00
    },
    "Sides": {
        "Fries": 2.00,
        "Coleslaw": 2.50,
        "Mashed Potatoes": 2.50,
        "Corn on the Cob": 2.00
    },
    "Desserts": {
        "Chocolate Cake": 3.00,
        "Ice Cream Cone": 1.00
    },
    "Beverages": {
        "Soft Drinks": 1.50,
        "Bottled Water": 1.00
    }
}

# File to save orders
orders_file = 'orders.json'

def load_orders():
    if os.path.exists(orders_file):
        with open(orders_file, 'r') as file:
            content = file.read()
            return json.loads(content) if content else []
    return []


def save_orders(orders):
    with open(orders_file, 'w') as file:
        json.dump(orders, file, indent=4)

@app.route('/menu', methods=['GET'])
def get_menu():
    return jsonify({"menu": menu})

@app.route('/bucket', methods=['POST'])
def send_bucket():
    data = request.json
    user_info = data.get('user_info', {})
    selected_items = data.get('items', [])
    
    if not selected_items or not user_info:
        return jsonify({'error': 'Items and user info are required.'}), 400
    
    # Calculate total
    item_prices = {item: get_item_price(item) for item in selected_items}
    total_amount = sum(item_prices.values())
    gst = total_amount * 0.18  # 18% GST
    final_total = total_amount + gst
    
    # Create order
    order = {
        'user_info': user_info,
        'items': selected_items,
        'item_prices': item_prices,
        'total_amount': total_amount,
        'gst': gst,
        'final_total': final_total,
        'status': 'pending'
    }
    
    # Save order
    orders = load_orders()
    orders.append(order)
    save_orders(orders)

    response = "You have selected the following items:\n" + "\n".join(selected_items)
    response += f"\nSubtotal: ${total_amount:.2f}\nGST (18%): ${gst:.2f}\nTotal: ${final_total:.2f}."
    response += "\nPlease confirm your order by sending 'confirm' along with your details."
    
    return jsonify({'response': response})

@app.route('/confirm', methods=['POST'])
def confirm_order():
    data = request.json
    user_info = data.get('user_info', {})
    
    orders = load_orders()
    for order in orders:
        if order['user_info'] == user_info and order['status'] == 'pending':
            order['status'] = 'confirmed'
            save_orders(orders)

            response = f"Thank you for your order! You've ordered: {', '.join(order['items'])}."
            response += f"\nYour total amount is: ${order['final_total']:.2f}."
            return jsonify({'response': response})
    
    return jsonify({'error': 'No pending order found for the provided details.'}), 404

@app.route('/cancel', methods=['POST'])
def cancel_order():
    data = request.json
    user_info = data.get('user_info', {})
    
    orders = load_orders()
    for order in orders:
        if order['user_info'] == user_info and order['status'] == 'pending':
            order['status'] = 'cancelled'
            save_orders(orders)

            response = "Your order has been canceled."
            return jsonify({'response': response})

    return jsonify({'error': 'No pending order found for the provided details.'}), 404

def get_item_price(item):
    for category, items in menu.items():
        if item in items:
            return items[item]
    return 0

if __name__ == '__main__':
    app.run(debug=True)
