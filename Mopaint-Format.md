# Mopaint File Format Ideas

These are just IDEAS for a possible file format, this doesn't reflect the current file format which is JSON-based and thus can't handle binary data well among other things.

- Text-based, readable even tho it can contain binary data
	- Flat and line oriented, good for git diffs
	- Binary data chunks are delimited with random ID tokens chosen to guarantee their absence within the data
	- Binary data chunks also specify the length in bytes for optimization (when possible), but this is optional
	- Case-insensitive? But canonically things should be a certain way, mostly title case
	- `#` comments?
	- Good for understandability, fixing corrupted files, extracting data with dumb scripts, etc.
	- Might want binary format for performance
- At least a little bit self documenting
	- Include a link to the spec
		- This link should be updated when forking the format
- Append-only log like, good for filesystem/storage performance and streaming over the network
- Documents can be split across multiple files, and parts stored on IPFS or other peer to peer technology
	- Peers can request parts that are most needed
- Self-container format, self-referential, recursive, however you want to put it, including older versions of the format in order to:
	- Avoid losing data due to bugs in document upgrading code
	- Maintain the append-only nature
	- Maximize backward/forward compatibility because the application can scan for data sections with a format version it can handle, and if it can't handle the latest of the versions present, it can show a dialog
- A graph of computation
	- Self-editing graph? Like it describes modifications to itself?
	- An amount of cache can be stored in the document, for performance, and can be traded off for file size (with user control)
		- Record times operations took to compute so a warning can be shown (and probably a red area on a slider) based on an estimate of how long it would take to recompute

Example sketch showing a document upgrade:
```
Mopaint

NKCQKDNUII=data start
Mopaint
FormatVersion=1.0
FormatInfo=https://github.com/1j01/mopaint
90JY7H4G69=Line(20, 4, 53, 350, "red")
6JXA6ZLRRQ=Line(12, 442, 2, 42, "yellow") on 90JY7H4G69
data end NKCQKDNUII

19BL017EBV=data start
Mopaint
FormatVersion=1.1
FormatInfo=https://github.com/1j01/mopaint
RJHDPN3IZ3=Import(NKCQKDNUII)
UJFK5EDORT=Line(x1=34, y1=34, x2=24, y2=244, color="green") on RJHDPN3IZ3
Head=UJFK5EDORT
data end 19BL017EBV
```

Note: need to guarantee ID uniqueness when importing a document (and in general)

If the outer data section is continuously growing, 1. it might need to have the end delimiter be optional, and I don't really like the idea of it being unclear whether a file is complete or not (most likely due to a partial download) (altho I like that it might be able to read a partial file), 2. the data section's ID might need to be updated, all data added checked for conflict with the ID.

So I might want to base the format more around performant seek-based updates rather than being append-only wherever possible.
- Probably want a footer
- Might want to reserve space around version numbers so they can be updated in place, given that they're ASCII representations (it'd be easier if they were binary numbers)
	- Underscores are probably the clearest placeholder

Also I should think more about how it can work with peer to peer sharing protocols, like,
- Should the IDs always be hashes of all the data within?
	- Referenced data, at least when referenced via a hash like IPFS (content-addressed storage) and not a regular filesystem, the hash should be sufficient to account for any possible changes within the sourced data. But should outer/parent hashes be able to stay the same based on whether data is contained or linked?
- What does it look like with the data omitted with a reference in its place?
- Sharing files/blobs between documents
	- When deleting a document, it should delete subresources not shared with any other document, and ask about subresources shared with other documents / let you know about said documents
