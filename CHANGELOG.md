# Changelog

This file lists the changes of each version of `@mark1russell7/optional`. The versions follow Semantic Versioning.

## 1.3.0

- The new entry `@mark1russell7/optional/read` reads unknown values, for example the value of a parsed JSON text. The root entry does not change.
- `isRecord` is true for an object that is not an array and not `null`.
- The readers `readText`, `readNumber`, `readBoolean`, `readTime`, `readRecord` and `readArray` give `undefined` for a value of a wrong type.
- `readTime` reads only ISO 8601: a date, or a date and a time with a zone. A local time with no zone gives `undefined`.
- The field readers `fieldOf`, `textOf`, `numberOf`, `booleanOf`, `timeOf`, `recordOf` and `arrayOf` read only an own field of a record.
- The decoders give a `Result`. The error has the path of the first bad field as keys and indexes, the expected value and the kind of the found value.
- MINOR: a new entry, and each old export stays the same.
