# Mopaint

A revolutionary editing system.

#### Project Status

You can play with the work-in-progress app at [mopaint.app](https://mopaint.app)

Features:
- Autosaves locally within the app, including history (Note: if you "clear cookies" in your browser it will likely delete documents autosaved within the app)
- Save/load documents, including history
- Non-destructive (non-linear) history: get back to *any point* in history with the history sidebar, even if you undo and do something else. Instead of discarding redos, it creates a new branch in the *history tree*.
- Some symmetry tools. They're procedurally combined together with the basic drawing tools.

Limitations:
- **The vision for the project is not yet realized.**
- There looks like there's a bunch of tools but there's not actually that much interesting variation. Symmetry tools are combined statically, instead of letting you combine it with whatever you want as a user.
- Many features you'd want in a basic image editor are missing
	- No brush sizes (tho you can try with the "Free-Form Circles" tool(s))
	- No oval tool (only circles)
	- No text tool
	- No zoom (tho you can use your browser's zoom)
	- Can't resize document; it's fixed at 640x480 pixels

#### Principles

- Holistic design
	- Do more with less. Less concepts, more functionality.
- Don't Discard Data by Default
	- Only discard information at the user's request, whether by explicit action at the time or preference.
- [Fearless Exploration][]
	- Let users explore fearlessly, both the interface, and paths of work. Reduce worry.

#### Ideas

- Everything is *always saved*, including undo history.
- You can get back to *any state*, with non-destructive (non-linear) undo history. I actually implemented this first in [JS Paint][], my browser-based clone of MS Paint (but in JS Paint the undo history isn't saved in the session, and it's really inefficient. I hope to eventually base JS Paint on Mopaint.)
- Change anything after-the-fact. You don't have to worry about following the exact right steps (like selecting the right layer before drawing), because you can *change the steps*. Edit history as easily as creating it in the first place.
- Support multiple views on a document, in panes as well as in separate windows. In the latter case it would act and work similar to multi-user support.
- Preview how changes affect different parts of a document, in panes that show those parts of the document. This would be especially useful for animations or large scenes with copies of objects.
- Instead of having "Smart Objects" and "Smart Filters" (as well as dumb equivalents) as in Photoshop, literally everything is "smart", because the *editing model* is "smart". Every brush stroke is smarter than a Smart Object, when you want it to be (if you want to personify it like that.)
- Instead of having "Clipping Masks", in addition to being able to select a region and delete (for a one-off), you can just do the latter and then "edit earlier" and it'll live-update.
- (There can still be tools/UI that help you set up masks etc., but the document structure will be much more general. Part of the point is that you could do something like that yourself, even something new (it doesn't need to be built-in), and, there isn't a feature that *doesn't* have an equivalent "Smart" feature where you can edit source material and see results live update.)
- Texturing 3D models by drawing directly on them would be fun (like [Chameleon][], [Chameleon.js][], [SculptGL][], [Paint 3D][]).
- If we can do texturing on 3D models, it should be possible to extend that to drawing on tesselated canvases, to create different types of repeating patterns, like [EscherSketch][].

#### What is in a name?

What might we stand to gain?

- **m**obily **o**perable
- **m**ultiuser **o**nline
- **m**assively **o**penended
- **mo**dern
- **mo**dular
- **m**odus **o**perandi
- **mo**rphing images
- making **mo**ckups
- **mo**tion (i.e. animation)
- e**mo**tion
- maybe some [custom, dynamic e**mo**ji](https://github.com/multiism/emoji)
- **mo**re!
- maybe 3D **mo**deling (**m**ake **o**bjects **p**retty **a**rtistically **in** **t**his thing)
- but the document **mo**del is the important part

Mopaint. More than paint.

Mo' painters, mo' fun! Mopaint.

**m**aking **o**ssum **p**ossum **a**rtistic **i**nterfaces & **n**ovel **t**ools, that's my M.O.

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
[Fearless Exploration]: https://isaiahodhner.io/fearless-exploration
