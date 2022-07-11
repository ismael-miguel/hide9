# Hide9
Hides all the content that belongs to 9GAGGER bot or promoted content.

## How does it work?

It clicks "I don't like this" for you.
That's all...

This is the best way, thanks to the awful coding from 9gag.com.

It also adds an icon that lists all hidden posts, if you wish to open them later on:<br>
![image](https://user-images.githubusercontent.com/10207857/176740788-777232fe-359e-49d5-91c7-108bf0f6b96e.png)

Promoted content doesn't have a title, therefore, it doesn't show on.<br>
(The real post name and preview will show in the list.)

## Issues:

- **Some posts aren't hidding**<br>
    When the posts are added to the document, not all `<article>` elements are available right away.<br>
    This is either a 9gag bug or a bug with the browser.<br>
    I've added a rather aggressive double-checking system which doesn't seem to be 100% enough...

- **Pressing <kbd>J</kbd> or <kbd>K<kbd> doesn't go to the next post**<br>
    Should be working fine.<br>
    However, sometimes, it may get "stuck".<br>
    This happens because of ads.

- **The preview is missing/broken**<br>
    Long posts with text and multiple images have a different URL.<br>
    I'm too lazy to figure it out...
