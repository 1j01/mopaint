
# Mopaint

Mopaint is a sort of rewrite of, or successor to [JS Paint],  
without the limiting factor of being first and foremost a recreation of MS Paint from Windows 98,  
on more solid foundations (e.g. [React] (or [Preact] or [Vue]) instead of [jQuery], [Webpack] (or [Rollup]) instead of a bunch of scripts, probably [Redux]... instead of just a bunch of mutable global variables),  
where I plan to implement things that I feel would be too difficult to implement in that codebase,  
starting first with collaborative image editing.

I want it to be a *modern*, *modular*, *multi-user* painting app, and *more!*

I may backport some things to JS Paint, and may eventually rewrite JS Paint to use a core editing engine of Mopaint.

## Crazy (or at least Kooky) Ideas

#### Merging Concepts

What if selections were just layers?  
(what if selections were just layers in a mode? and would it *have* to be a mode?)  
what if you could have hierarchial selections? selections within selections, sublayers of layers?  
what if layers, layer groups, frames of an animation, selections, copy-pastes/duplicates, "smart objects", [recursive fractal references], shapes and brush strokes and other operations - from you or other users, were all the same thing?  
what about masking? that could be the same as a selection, right?

[recursive fractal references]: http://dood.al/

How many of these things are feasible?  
what are the relationships between these objects/concepts?  
are they fundamentally different? (the objects/concepts, or the relationships between them)  
how many of these concepts could feasibly be *merged*, and made more *powerful*?  
what if *anything that works with one thing* worked with the others?  

Frames as the same thing as layers I think would be "pushing it",  
with animation support, it's an invitation for fancy features like tweening and stuff, of objects that persist between frames,  
but 

If you're doing frames of an animation, why not go all out, and...  
why not make it nonlinear? why not make it a *nonlinear* animation program?  
(like for games and stuff? interactive stories or whatever?)  
(sprites within games, with state machines, for sure could use a nonlinear timeline)  
(um, timegraph? timey-wimey... timey-wimey graph, okay?)

What if history was the same thing as layers?  
What if you could rearrange it just the same?  
Both layers and history would cache the latest image.  
And maybe other points within the stack.  

#### Interlude Poem

what if questions questioned *you*?  
what if questions were people *too*?  
what if your quest for questions was quenched?  
what if mine was, would I be benched?  

also what if software worked  
like, what if it was good  
tho  

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
(i.e. editing textures on a 3D model),  
and it can handle wrapping seamlessly around a cylinder,  
we should be able to do tessalation (and simple wrapping and symetry) pretty easily.  
For instance, here's an infinitely zooming set of patterns, in 2D, but made with Three.js:  
http://www.infinitezoom.net/ (or [backup link](https://web.archive.org/web/20180127023916/http://www.infinitezoom.net/))  
(just imagine texture on those shapes)  

What about 3D painting not just *on* 3D, but *in* 3D?  
like [Tilt Brush](https://www.tiltbrush.com/) (a VR thing)  
(or *vaguely* like [Pixelweaver](https://github.com/1j01/pixelweaver) (a code-doodling thing))  
I don't think a lot of 2D tools would map so well to 3D,  
and, certainly they'd have a better chance if they had to use a 3D API,  
but idk, what would a flood fill tool be?  
it'd have to use voxels–or, it wouldn't *have* to, but–  
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

Actually, I'm combining this idea with [Pixelweaver](https://github.com/1j01/pixelweaver) (another project of mine, focused on reprodubibility), and writing a manifesto. Make **Making** Better.
Yes, that sounds even broader (probably) (or ridiculously broad), but really, I *am* going to try to figure out what the scope is.

[JS Paint]: https://github.com/1j01/jspaint/
[React]: https://facebook.github.io/react/
[Preact]: https://preactjs.com/
[Vue]: https://vuejs.org/
[jQuery]: https://jquery.com/
[Webpack]: https://webpack.github.io/
[Redux]: http://redux.js.org/
[Rollup]: https://rollupjs.org/

