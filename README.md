# Mopaint

Mopaint is a sort of rewrite of, or successor to [JS Paint][],  
without the limiting factor of being first and foremost a recreation of MS Paint from Windows 98,  
on more solid foundations (e.g. [React][] or [Preact][] or [Vue][] or [Svelte][] instead of [jQuery][],
[Webpack][] or [Rollup][] instead of a bunch of scripts,
probably [Redux][] or similar patterns instead of just a bunch of mutable global variables),  
where I plan to implement things that I feel would be too difficult to implement in that codebase,  
such as collaborative image editing.

I want it to be a ***mo**dern*, ***mo**dular*, ***m**obily **o**perable*, ***m**ultiuser **o**nline* painting app, and ***mo**re!*  

(I may backport some things to JS Paint, and may eventually rewrite JS Paint to use a core editing engine of Mopaint.)

**Update:**
It's actually going to be more of a testing ground for new ideas about image editors and editors in general.
[Make **Making** Better][Make Making Better].
But also hopefully a really nice image editor. And more!

I mean, it should end up better than I was even conceiving before,
but probably take longer. because I'll be focusing on certain features first and
trying to make the tooling around tools really powerful,
rather than going ahead and making a lot of directly useful tools, which would be *easier*,
but make iterating on the tools as a whole and the process for making them etc. more difficult (more API usage and thus friction).
I want to keep it fairly few tools probably so churn is easier in the codebase.
That said I might end up creating a significant toolset early on, just because it's fun and useful, and pay the cost,
either in friction to changes,
or instability of the toolset by disabling tools to work on how tools work and progressively adding them back (or doing that work in branches).

## Crazy (or at least Kooky) Ideas

#### Merging Concepts

What if selections were just layers?  
(what if selections were just layers in a mode? and would it *have* to be a mode?)  
what if you could have hierarchial selections? selections within selections, sublayers of layers?  
what if layers, layer groups, frames of an animation, selections, copy-pastes/duplicates, "smart objects",
[recursive fractal references][Doodal], shapes and brush strokes and other operations - from you or other users, were all the same thing?  
what about masking? that could be the same as a selection, right?

How many of these things are feasible?  
what are the relationships between these objects/concepts?  
are they fundamentally different? (the objects/concepts, or the relationships between them)  
how many of these concepts could feasibly be *merged*, and made more *powerful*?  
what if *anything that works with one thing* worked with the others?  

Frames *could* be the same thing as layers. It can be nice to be limited to drawing individual frames, like a flipbook.  
But I don't think that should be the main way that animation works. (You could do that if you wanted, probably.)  
With animation support, it's inevitable to want features like tweening, objects that persist between frames.  
If you're drawing everything in a form that interpolates between frames, and you record movement thru direct manipulation over time, you don't necessarily need to think about frames.  
(You also might have an animation that plays back at different rates, like for slowmo in a game.)  
If you zoom in to edit motion finely in the context of an object, the basic level of defining motion / variance over time *could* be keyframes, or it *could* be a *function*.  
what if it was a *function*?  

Also, you might want onion skinning over time, as well as over operations or layers.  

If you're doing animation, why not go all out, and allow for *nonlinear* animation?  
(like for games and stuff? interactive stories or whatever?)  
(sprites within games, with state machines, for sure could use a nonlinear timeline)  
(or would it be a time*graph*?)  
Time could be a parameter, and then you could simply have more parameters. Or different parameters.  

What if history was the same thing as layers?  
What if you could rearrange it just the same?  
Both layers and history would cache the latest image.  
And maybe other points within the stack.  

#### Interlude

what if questions questioned *you*?  
what if questions were people *too*?  
what if your quest for questions was quenched?  
what if mine was, would I be benched?  

also what if software worked  
like, what if it was good  

#### Programmability / Generativity

What if documents were reproducible?  
what if they contained all the code for brushes and other tools,  
and all the operations that created it?  
(what if you could edit the application as easily as its contents?)  

What if you could make your own tools really easily?  
what if all the tools were *fully* configurable in their behavior?  
what if most of them were just *presets* of more general tools/functions?  
what if they were *composible*?  
what if there was a *community* of people creating and remixing tools?  

#### Modularity of Document Types

What if you could paint on tessalated/wrapping canvases, infinite canvases, 3D models, etc., all with the same toolset?  

If we implement 3D documents  
(i.e. editing textures on a 3D model,
like [Chameleon][], [Chameleon.js][], [Paint 3D][], [SculptGL][], etc.),  
(actually probably not like Chameleon with its dynamic re-UV-mapping,)  
if it can handle wrapping seamlessly around a cylinder (across triangles, drawing multiply),  
we should be able to do tessalation, wrapping and symetry pretty easily.  
For instance, here's an infinitely zooming set of patterns, in 2D, but made with Three.js: [Infinite Zoom][]
(just imagine texture on those shapes)  

What about 3D painting not just *on* 3D, but *in* 3D?  
like [Tilt Brush][] (a VR thing)  
(or *vaguely* like [Pixelweaver][] (a code-doodling thing))  
I don't think a lot of 2D tools would map so well to 3D,  
and, certainly they'd have a better chance if they had to use a 3D API,  
but idk, what would a flood fill tool be?  
it'd have to use voxels–or, it wouldn't *have* to, but  
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

Actually, I'm combining this idea with [Pixelweaver][]
(another project of mine, focused on reprodubibility),
(and other projects),
and writing a manifesto. [Make **Making** Better][Make Making Better].
Yes, that probably sounds really broad, but I *am* trying to figure out what the scope is.

[JS Paint]: https://github.com/1j01/jspaint/
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
[Make Making Better]: https://isaiahodhner.ml/make-making-better/
