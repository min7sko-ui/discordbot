# AdvancedOrders

A Minecraft Paper plugin for 1.21.1 that adds a fully GUI-based order system similar to DonutSMP.

## Features

- **GUI-Based Interface**: All interactions through intuitive GUIs
- **Buy Orders**: Players can create orders for items they want to buy
- **Order Fulfillment**: Other players can fulfill orders and receive money
- **Sign Input**: Use signs for entering quantities and prices
- **Economy Integration**: Fully integrated with Vault economy
- **Security**: Protected against dupes, race conditions, and inventory glitches
- **Pagination**: Infinite pages for viewing all orders
- **Data Persistence**: Orders are saved and restored on server restart

## Requirements

- Minecraft Paper 1.21.1 or higher
- Java 21
- Vault plugin
- An economy plugin (e.g., EssentialsX)

## Installation

1. Download the plugin JAR file
2. Place it in your server's `plugins` folder
3. Ensure Vault and an economy plugin are installed
4. Restart the server
5. Configure settings in `plugins/AdvancedOrders/config.yml` if needed

## Commands

- `/orders` - Open the main orders GUI

## Permissions

- `advancedorders.use` (default: true) - Allows using the orders system
- `advancedorders.admin` (default: op) - Allows administrative access

## Building

To build the plugin from source:

```bash
./gradlew build
```

The compiled JAR will be in `build/libs/`.

## Usage

1. Use `/orders` to open the orders GUI
2. Click the emerald to create a new order
3. Place the item you want to buy in the GUI slot
4. Right-click a sign and enter the quantity on the first line
5. Right-click another sign and enter the price per item on the first line
6. Your order is created!
7. Other players can click on orders to fulfill them
8. When fulfilled, you receive the items and they receive the money

## License

This plugin is provided as-is without warranty.
