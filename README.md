# Mopaint

A revolutionary editing system.

Prototype. Work in progress. Nothing to see yet.

#### Principles

- Holistic design
- Don't destroy data by default.
- Let users explore *fearlessly*.

Don't destroy data by default, only by explicit user action.

Let users explore fearlessly, both the interface, and paths of work.


#### Ideas

- Everything is (will be) always saved, including undo history.
- You can (will be able to) get back to any state, with non-destructive (non-linear) undo history. I've actually implemented this in [JS Paint][], my browser-based clone of MS Paint (but the undo history isn't saved in the session, and it's really inefficient, simply saving snapshots of the document for each undo state. I hope to eventually base JS Paint on Mopaint.)
- Change anything after-the-fact. You don't have to worry about following the exact right procedure (like selecting the right layer before drawing), because you can *change the procedure*. Edit history as easily as creating it in the first place.
- Texturing 3D models by drawing directly on them would be fun (like [Chameleon][], [Chameleon.js][], [SculptGL][], [Paint 3D][]).
- If we can do texturing on 3D models, it should be possible to extend that to drawing on tesselated canvases, to create different types of repeating patterns, like [EscherSketch][].
- Allow multiple views on a document (in separate tabs, and in the same tab in some kind of panes/panels).
- With multiple views support, show previews of how changes affect different parts of a document, especially in animations or large scenes with copies of objects.
- Speaking of copies of objects, copy and paste can be much more powerful, because you can edit the original and have it proppagate to copies, or choose a subset of copies to change. This would be great for music production. Imagine, you have a musical phrase, and you copy it and change a note in the copy. You can then change the original, and have it propagate to the copy while maintaining the change in the copy. (Or if you change the copy, you can propagate it back to the original, by moving (retargeting) the change to the original.)
- Instead of having "Smart Objects" and "Smart Filters", as well as dumb equivalents, as in Photoshop, literally everything is "smart", because the *editing model* is "smart". Every brush stroke is smarter than a Smart Object. When you want it to be. If you want to personify it like that.


#### What is in a name?

What might we stand to gain?

- **m**obily **o**perable
- **m**ultiuser **o**nline
- **m**assively **o**penended
- **mo**dern
- **mo**dular
- maybe 3D **mo**deling (**m**ake **o**bjects **p**retty **a**rtistically **in** **t**his thing)
- **mo**tion (animation) (maybe even make full-blown **mo**vies)
- e**mo**tional paintings
- maybe some [custom, dynamic e**mo**ji](https://github.com/multiism/emoji))
- **mo**re!

Mopaint. More than paint.

Mo' painters, mo' fun! Mopaint.

Making [making][Make Making Better] Ossum possum, that's my M.O. That's my modus operandi.  

The file extension could be `.mop`, and it could stand for Mopaint Project,
and/or relate to tools, like a mop. _Mop - ain't_ that great? :P

[JS Paint]: https://github.com/1j01/jspaint/
[Apparatus]: http://aprt.us/
[Doodal]: https://dood.al/
[Chameleon]: http://www-ui.is.s.u-tokyo.ac.jp/~takeo/chameleon/chameleon.htm
[Chameleon.js]: https://github.com/tomtung/chameleon.js
[Paint 3D]: https://www.microsoft.com/en-us/store/p/paint-3d/9nblggh5fv99
[SculptGL]: https://stephaneginier.com/sculptgl/
[EscherSketch]: https://eschersket.ch/
[Multiism]: https://multiism.ml/
[The Future of Programming]: https://vimeo.com/71278954
[Make Making Better]: https://isaiahodhner.ml/make-making-better/
