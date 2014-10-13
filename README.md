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

// Create an event listener
store.on('test.one', function () {
  // Do something any time "test.one" is changed or deleted
});

// Remove an event listener
store.off('test.one');

// Delete something
store.remove('test');
```

## Event listener recursion

In cases where a callback attached with an event listener modifies the story and
has potential to retrigger itself, there is a suppression mechanism in place to
prevent it. I can not think of any practical scenarios where this would be
useful, but it is possible to loosen up this restriction via the `config`
method. By default, the recursion threshold is set to 1 and callbacks will not
fire more than once.

```javascript
// Set event listener callbacks to fire themselves a maximum of 5 times each
store.config({ eventRecursion: 5 });
```
