Story
=====

This is basically just a wrapper for `localStorage`.

## Usage

```javascript
// Create a "story"
var store = new Story('Namespace');

// Configure it
store.config({
  // Enables fallback and restoration to cookies. Default is off.
  useCookies: true,

  // Sets default values
  defaults: {
    name: 'tje'
  }
});

// Set values
store.set('test.myString', 'Hello!');
store.set('test.myBoolean', false);
store.set('test.myObject', { one: 'Howdy!', two: 'Ahoy!' });
store.set({
  test: {
    myNumber: 1234,
    myDate: new Date()
  }
});

// Read some values
store.get('test.myObject');     // > Object {one: "Howdy!", two: "Ahoy!"}
store.get('test.myObject.two'); // > "Ahoy!"

// Delete something
store.delete('test');
```
