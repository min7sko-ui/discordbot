// Example Addon for Advanced Ticket Bot
// Place your custom addons in the /addons directory

export default {
  name: 'Example Addon',
  version: '1.0.0',
  description: 'An example addon showing the structure',
  author: 'Your Name',

  // Called when addon is loaded
  async onLoad(client) {
    console.log('Example addon loaded!');
    
    // You can add custom commands, event listeners, etc.
    // Example: client.on('messageCreate', (message) => { ... });
  },

  // Called when addon is unloaded
  async onUnload() {
    console.log('Example addon unloaded!');
  }
};
