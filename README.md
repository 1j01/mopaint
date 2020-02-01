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

- Everything will be *always saved*, including undo history.
- You'll be able to get back to *any state*, with non-destructive (non-linear) undo history. I've actually implemented this in [JS Paint][], my browser-based clone of MS Paint (but the undo history isn't saved in the session, and it's really inefficient. I hope to eventually base JS Paint on Mopaint.)
- Change anything after-the-fact. You don't have to worry about following the exact right procedure (like selecting the right layer before drawing), because you can *change the procedure*. Edit history as easily as creating it in the first place.
- Support multiple views on a document, in panes as well as in separate windows. In the latter case it would act and work similar to multi-user support.
- Preview how changes affect different parts of a document, in panes that show those parts of the document. This would be especially useful for animations or large scenes with copies of objects.
- Instead of having "Smart Objects" and "Smart Filters" (as well as dumb equivalents) as in Photoshop, literally everything is "smart", because the *editing model* is "smart". Every brush stroke is smarter than a Smart Object, when you want it to be (if you want to personify it like that.)
- Texturing 3D models by drawing directly on them would be fun (like [Chameleon][], [Chameleon.js][], [SculptGL][], [Paint 3D][]).
- If we can do texturing on 3D models, it should be possible to extend that to drawing on tesselated canvases, to create different types of repeating patterns, like [EscherSketch][].

#### What is in a name?

What might we stand to gain?

- **m**obily **o**perable
- **m**ultiuser **o**nline
- **m**assively **o**penended
- **mo**dern
- **mo**dular
- **mo**rphing images
- **mo**ckups
- **mo**tion (i.e. animation)
- e**mo**tion
- **mo**re!
- maybe some [custom, dynamic e**mo**ji](https://github.com/multiism/emoji))
- maybe 3D **mo**deling (**m**ake **o**bjects **p**retty **a**rtistically **in** **t**his thing)
- but the document **mo**del is the important part

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
