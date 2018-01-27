
# Mopaint

Mopaint is a sort of rewrite of [JS Paint]
on more solid foundations (e.g. [React] instead of jQuery, [Webpack] instead of a bunch of scripts, probably [Redux]... instead of just mutable global variables),
without the limiting factor of being first and foremost a recreation of MS Paint from Windows 98,
where I plan to implement things that I feel would be too difficult to implement in that codebase,
starting first with collaborative image editing.

I want it to be a modern, modular, multiplayer painting app, and more.

I may backport some things to JS Paint, and may eventually rewrite JS Paint to use a core editing engine of Mopaint.

## Crazy (or at least Kooky) Ideas

What if selections were just layers?  
what if selections were just layers in a mode? (does it *have* to be a mode?)  
what if you could have hierarchial selections? sublayers of layers?  
what if layers, frames of an animation, selections, copy-pastes/duplicates, "smart objects", recursive fractal references, shapes and brush strokes, from you other other users, were all the same thing?  

How many of these things are feasible?  
what are the relationships between these objects/concepts?  
are they fundamentally different? (the objects/concepts, or the relationships between them)  
how many of these concepts could feasibly be merged, and made *more powerful*?  
if these concepts could be merged, how much more powerful could it be, with *anything that works with one thing* working with the others?

What if life was a poem?  
what if every step you took was a move in a dance? casual or clumsy, but *sometimes* intentional  
what if you danced everywhere you went? what of time spent?  
what *if* time spent?  
what if you danced everywhere you want? why don't you find out?  

What if all these *questions* were the same thing?  
what if questions questioned *you*?  
what if questions are people *too*?  
what if your quest for questions was quenched?  
what if mine was, would I be benched?  

What if you could rearrange history,  
same as you can with layers?  
Both layers and history should cache the latest image.  
And maybe other points within the stack.  

What if *all* applications had nonlinear undo?  
what if the operating system handled undo/redo? (extensibly... and comprehensively)  
what if ReversibleComputing?  
what if computing was reinvented with what we know today?  

What if documents were reproducible?  
what if they contained all the code for brushes and other tools,  
and all the operations that created it?  
what if you could edit an application as easily as its contents?  

What if you could make your own tools, really easily?  
what if all the tools were *fully* configurable in their behavior?  
what if most of them were just presets of more general tools/functions?  

What if you could paint on tessalated/wrapping canvases, infinite canvases, 3D models, etc., all with the same toolset?  

If we implement 3D documents  
(i.e. editing textures on a 3D model),  
and it can handle wrapping seamlessly around a cylinder,  
we should be able to do tessalation (and simple wrapping and symetry) pretty easily.  
For instance, here's an infinitely zooming set of patterns, in 2D, but made with Three.js:  
http://www.infinitezoom.net/ (or [backup link](https://web.archive.org/web/20180127023916/http://www.infinitezoom.net/))  
(just imagine texture on those shapes)  

What about 3D painting itself?  
i.e. like [Tilt Brush](https://www.tiltbrush.com/) (a VR thing)  
(or kinda like [Pixelweaver](https://github.com/1j01/pixelweaver) (a code-doodling thing))  
I don't think a lot of 2D tools would map so well to 3D,  
and certainly they'd have a better chance if they had to use a 3D API,  
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

[JS Paint]: https://github.com/1j01/jspaint/
[React]: https://facebook.github.io/react/
[Webpack]: https://webpack.github.io/
[Redux]: http://redux.js.org/
