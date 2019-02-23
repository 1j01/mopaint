# Mopaint

Mopaint is a testing ground for ideas about image editors and editors in general.  

As an application,
I want it to be a
_**mo**dern_, _**mo**dular_,
_**m**obily **o**perable_, _**m**ultiuser **o**nline_
painting app, and _**mo**re!_  

I'll be focusing on trying to make the _tooling around tools_ really powerful,
rather than going ahead and making a large toolset, which would be _easier_ and more directly useful,
but add friction to iterating on how tools work as a whole, and the process for making them etc.  
(That said it can be really fun and useful, and it might be worth the cost of friction.)

#### See also:

- [Apparatus][] - "a hybrid graphics editor and programming environment for creating interactive diagrams"

- [JS Paint][] - my clone of MS Paint from Windows 98

## A few principles / Thesis statement

* Don't discard and destroy data by default, dang it! Human-computer interaction is incredibly lopsided, with great output ability (a perfectly plentiful plethora of pixels in parallel, plus piezoelectrics) vs input ability (discrete key presses, mouse clicks, linear mouse movements, and *sometimes* speech, but that's generally only taken advantage of as plain text with long delays), so input is precious. I want people to retroactively record and use data they didn't and couldn't know they would have wanted to record beforehand. If you know your work is always saved, and everything you do, every brush stroke, is usable & reusable (& refactorable) in the future, I think it will unlock a new kind of zen art exploration and encourage truly new kinds of art.

* Minimize the conceptual surface, and maximize applicability.
Combine components/elements/ideas in the UI where possible.
Make anything that works with one thing also work with another by making them the same thing.
Do more with less. [Multiism][].
(Once you have some data, there are a million and one things the user might want to do with it, manipulate it, organize it.
The user should be able to act on different objects/data in the same ways if possible.
Bulk actions should be a natural extension of singular actions, or the same if possible, if it makes sense.
And many things a user might want to do could be handled in a common way across editors.)

* Question the status quo. Try new things!
People design based on previous work because it's what they know.
It can be good to leverage understanding that users have so they can pick up software and use it faster and easier,
but you shouldn't copy existing ideas (components, elements, concepts, the *scope of a project* or program, etc.) without *question*.
(btw check out Bret Victor's talk [The Future of Programming][]. And his other work!)

## Crazy (or at least Kooky) Ideas

#### Merging Concepts

What if selections were just layers?  
((what if selections were just layers in a mode? and would it _have_ to be a mode?))  
what if you could have hierarchial selections? selections within selections, sublayers of layers?  
what if layers, layer groups, frames of an animation, selections, copy-pastes/duplicates, "smart objects",
[recursive fractal references][Doodal], shapes and brush strokes and other operations - from you or other users, were all the same thing?  
what about masking? that could be the same as a selection, right?

How many of these things are feasible?  
what are the relationships between these objects/concepts?  
are they fundamentally different? (the objects/concepts, or the relationships between them)  
how many of these concepts could feasibly be _merged_, and made more _powerful_?  
what if _anything that works with one thing_ worked with the others?  

Animation frames _could_ be the same thing as layers. It _can_ be nice to be limited to drawing individual frames, like a flipbook.  
But I don't think that should be the main way that animation works. (You could do that if you wanted, probably.)  
With animation support, it's inevitable to want features like tweening, objects that persist between frames.  
If you're drawing everything in a form that interpolates between frames, and you record movement thru direct manipulation over time, you don't necessarily need to think about frames.  
(You also might have an animation that plays back at different rates, like for slowmo in a game.)  
If you zoom in to edit motion finely in the context of an object, the basic level of defining motion / variance over time _could_ be keyframes, or it _could_ be a _function_.  
what if it was a _function_?  

Also, you might want onion skinning over time, as well as over operations or layers.  

If you're doing animation, why not go all out, and allow for _nonlinear_ animation?  
(like for games and stuff? interactive stories or whatever?)  
(sprites within games, with state machines, for sure could use a nonlinear timeline)  
(or would it be a time*graph*?)  
Time could be a parameter, and then you could simply have more parameters. Or different parameters.  

What if history was the same thing as layers?  
What if you could rearrange it just the same?  
Both layers and history would cache the latest image.  
And maybe other points within the stack.  

#### Interlude

what if questions questioned _you_?  
what if questions were people _too_?  
what if your quest for questions was quenched?  
what if mine was, would I be benched?  

also what if software worked  
like, what if it was good  
tho  

#### Programmability (& [Generativity][])

What if documents were reproducible?  
what if they contained all the code for brushes and other tools,  
and all the operations that created it?  
(what if you could edit the application as easily as its contents?)  

What if you could make your own tools really easily?  
what if all the tools were _fully_ configurable in their behavior?  
what if most of them were just _presets_ of more general tools/functions?  
what if they were _composible_?  
what if there was a _community_ of people creating and remixing tools?  

#### Modularity of Document Types

What if you could paint on tessellated/wrapping canvases, infinite canvases, 3D models, etc., all with the same toolset?  

If we implement 3D documents  
(i.e. editing textures on a 3D model,
like [Chameleon][], [Chameleon.js][], [Paint 3D][], [SculptGL][], etc.),  
(actually probably not like Chameleon with its dynamic re-UV-mapping,)  
if it can handle wrapping seamlessly around a cylinder (across triangles, drawing multiply),  
we should be able to do tessellation, wrapping and symmetry pretty easily.  
For instance, here's an infinitely zooming set of patterns, in 2D, but made with Three.js: [Infinite Zoom][]
(just imagine texture on those shapes)  

What about 3D painting not just _on_ 3D, but _in_ 3D?  
like [Tilt Brush][] (a VR thing)  
(or _vaguely_ like [Pixelweaver][] (a code-doodling thing))  
like, an airbrush tool could add dots in a sphere, etc.  

idk.  
I was thinking, "no, this is totally out of scope" but,  
I'll have to think about it... (in relation to other tools and stuff)...  
what is scope, anyways?  

WHAT IF...  

(let me just do some calculations here)  
420° − 69° + (3×[3](https://www.google.com/search?q=illuminati&tbm=isch))° = 360°...  

THREE SIXTY  

NO  
SCOPE  

[Make **Making** Better][Make Making Better].

#### What is in a name?

What might we stand to gain?

- **m**obily **o**perable
- **m**ultiuser **o**nline
- **m**assively **o**penended
- **mo**dern
- **mo**dular
- **mo**dels / 3D **mo**deling (**m**ake **o**bjects **p**retty **a**rtistically **in** **t**his thing)
- **mo**tion (animation) (maybe even make full-blown **mo**vies)
- e**mo**tion (in art; maybe some [custom e**mo**ji](https://github.com/multiism/emoji))
- **mo**re!

Mopaint. More than paint.

Mo' players? mo' fun! Mopaint. _(or)_  
Mo' painters, mo' fun! Mopaint.

Making stuff Ossum possum, that's my M.O. That's my modus operandi.  
Making [making][Make Making Better] Ossum possum, _that's_ my modus operandi.

Oh also the file extension could be `.mop`, and it could stand for Mopaint Project,
and/or relate to tools, like a mop. _Mop - ain't_ that great? :P
(But also it could use `.png`, extending it as a "pngram" (like I've done for [Pixelweaver][]))

Mo' pain, mo' gain, or something like that.

[JS Paint]: https://github.com/1j01/jspaint/
[Apparatus]: http://aprt.us/
[Wavey]: https://github.com/1j01/wavey/
[Cityship]: https://github.com/1j01/cityship/
[Chiptool]: https://github.com/1j01/chiptool/
[Skele2D]: https://github.com/1j01/skele2d/
[Tiamblia-original]: https://github.com/1j01/tiamblia-original/
[React]: https://facebook.github.io/react/
[Preact]: https://preactjs.com/
[Vue]: https://vuejs.org/
[Svelte]: https://github.com/sveltejs/svelte
[jQuery]: https://jquery.com/
[Webpack]: https://webpack.github.io/
[Redux]: https://redux.js.org/
[Rollup]: https://rollupjs.org/
[Chameleon]: http://www-ui.is.s.u-tokyo.ac.jp/~takeo/chameleon/chameleon.htm
[Chameleon.js]: https://github.com/tomtung/chameleon.js
[Paint 3D]: https://www.microsoft.com/en-us/store/p/paint-3d/9nblggh5fv99
[SculptGL]: https://stephaneginier.com/sculptgl/
[Infinite Zoom]: https://www.infinitezoom.net/
[Tilt Brush]: https://www.tiltbrush.com/
[Pixelweaver]: https://github.com/1j01/pixelweaver/
[Doodal]: https://dood.al/
[Multiism]: https://multiism.ml/
[Generativity]: https://progrium.com/wiki/Generativity/
[The Future of Programming]: https://vimeo.com/71278954
[Make Making Better]: https://isaiahodhner.ml/make-making-better/
