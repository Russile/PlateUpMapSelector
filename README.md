# PlateUp Map Selector

A web-based tool for browsing, filtering, and selecting custom maps for PlateUp!

🔗 [Use the tool online](https://russile.github.io/PlateUpMapSelector/)

## Features
- Browse all available custom maps with preview images
- Filter maps by:
  - Player count (2p+, 3p+, etc.)
  - Size (Small, Medium, Large, Huge)
  - Type (diner, kitchen, restaurant, etc.)
  - Difficulty (easy, hard)
  - Authors
- Search maps by name
- Select multiple maps
- Export selections as a ready-to-use configuration file

## How to Use
1. Visit the [web app](https://russile.github.io/PlateUpMapSelector/)
2. Browse and filter maps using the tools at the top
3. Click maps to select/deselect them
4. Click "Save Selection" to download your configuration
5. Move the downloaded `default.json` file to:
   ```
   %USERPROFILE%\AppData\LocalLow\It's Happening\PlateUp\UserData\KitchenDesignSelector\default.json
   ```
   (Typically: `C:\Users\[YourUsername]\AppData\LocalLow\It's Happening\PlateUp\UserData\KitchenDesignSelector\default.json`)

## Development
This is a static web application using:
- HTML5
- JavaScript (vanilla)
- Bootstrap 5 for styling
- GitHub Pages for hosting

To run locally:
1. Clone the repository
2. Open `index.html` in your browser

## Contributing
Feel free to open issues or submit pull requests for:
- New features
- Bug fixes
- UI improvements
- Additional maps 