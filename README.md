angular-indexed-db
==================

This is a small wrapper library around IndexedDB that uses AngularJS's `$q` rather than the `onsuccess` nonsense. 

This module implements the w3c spec of indexeddb to te best of its abilities. The one difference is cursor iteration: the return is not actually an angular `$q`, but rather something that allows you to call `result.continue()`

More docs soon.

Licensed under Apache v2