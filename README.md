# Mopaint

Mopaint is a testing ground for ideas about image editors and editors in general.  

As an application,
I want it to be a
_**mo**dern_, _**mo**dular_,
_**m**obily **o**perable_, _**m**ultiuser **o**nline_
painting app, and _**mo**re!_  

(It's also vaguely a successor to [JS Paint][],
without the limiting factor of being first and foremost a clone of MS Paint from Windows 98.)  

I'll be focusing on trying to make the _tooling around tools_ really powerful,
rather than going ahead and making a large toolset, which would be _easier_ and more directly useful,
but add friction to iterating on how tools work as a whole, and the process for making them etc.  
That said it can be fun and useful, and it might be worth the cost of friction (having to update a bunch of tools at once).  

## A few principles

* Minimize the conceptual surface and maximize applicability;
combine components/elements/ideas and make anything that works with X also apply to Y by making X and Y the same thing.
Do more with less. [Multiism][].
Once you have some data, there are a million and one things the user might want to do with it, manipulate it, organize it.
The user should be able to act on different objects in the same ways if possible.
Bulk actions should be a natural extension of singular actions, or the same if possible, if it makes sense.
And many things the user might want to do are common between editors, and could be shared.

* Question the status quo.
It's one thing to design an application to behave similarly to other applications so that users can pick it up easier and faster,
but another to copy existing ideas (components, elements, concepts, the scope of a project or program, etc.) without question.
(Check out Bret Victor's talk [The Future of Programming][]. And also his other work.)

## Crazy (or at least Kooky) Ideas

#### Merging Concepts

What if selections were just layers?  
(what if selections were just layers in a mode? and would it _have_ to be a mode?)  
what if you could have hierarchial selections? selections within selections, sublayers of layers?  
what if layers, layer groups, frames of an animation, selections, copy-pastes/duplicates, "smart objects",
[recursive fractal references][Doodal], shapes and brush strokes and other operations - from you or other users, were all the same thing?  
what about masking? that could be the same as a selection, right?

How many of these things are feasible?  
what are the relationships between these objects/concepts?  
are they fundamentally different? (the objects/concepts, or the relationships between them)  
how many of these concepts could feasibly be _merged_, and made more _powerful_?  
what if _anything that works with one thing_ worked with the others?  

Frames _could_ be the same thing as layers. It can be nice to be limited to drawing individual frames, like a flipbook.  
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
I don't think a lot of 2D tools would map so well to 3D,  
and, certainly they'd have a better chance if they had to use a 3D API,  
but idk, what would a flood fill tool be?  
it'd have to use voxels–or, it wouldn't _have_ to, but  
what would it be? what would be the point?  
if you look inside an object your vision is completely occluded?  
maybe it could be useful if joins shapes together that are near together  
anyways, like, an airbrush tool could add dots in a sphere,  
but what about custom tools? idk, should you have to design it with 3D in mind, at its core?  
idk.  
I was thinking, "no, this is totally out of scope" but,  
I'll have to think about it... (in relation to other tools and stuff)...  
what is scope, anyways?  

WHAT IF...  

(let me just do some calculations here)  
350°+10°=360°...  

THREE SIXTY  

NO  
SCOPE  

[Make **Making** Better][Make Making Better].

[JS Paint]: https://github.com/1j01/jspaint/
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
