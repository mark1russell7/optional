# Changelog

This file lists the changes of each version of `@mark1russell7/optional`. The versions follow Semantic Versioning.

## 1.5.1

An automated dependency update changes the shipped files, so this PATCH ships them.

## 1.5.0

- The entry `/read` has the new function `readHttpTime`. It reads the three date forms of RFC 9110 and the date and time of RFC 5322, the date of RSS.
- A zone is an offset, for example `-0500`, or a name of RFC 5322, for example `GMT` or `EST`. `UTC` and the military zone `Z` are also UTC.
- A year of two digits follows RFC 5322: 00 to 49 are 2000 to 2049. A military zone other than `Z` gives `undefined`.
- `httpTimeOf` reads an own field of a record with `readHttpTime`, and `decodeHttpTime` is its decoder.
- MINOR: three new exports, and each old export stays the same.

## 1.4.0

- The entry `/read` has the new function `isPlainObject`. It is true for a record whose prototype is `Object.prototype` or `null`.
- An object literal, a value of `JSON.parse` and `Object.create(null)` are plain objects. An array, a class instance, a `Date` and a `Map` are not.
- MINOR: a new export, and each old export stays the same.

## 1.3.0

- The new entry `@mark1russell7/optional/read` reads unknown values, for example the value of a parsed JSON text. The root entry does not change.
- `isRecord` is true for an object that is not an array and not `null`.
- The readers `readText`, `readNumber`, `readBoolean`, `readTime`, `readRecord` and `readArray` give `undefined` for a value of a wrong type.
- `readTime` reads only ISO 8601: a date, or a date and a time with a zone. A local time with no zone gives `undefined`.
- The field readers `fieldOf`, `textOf`, `numberOf`, `booleanOf`, `timeOf`, `recordOf` and `arrayOf` read only an own field of a record.
- The decoders give a `Result`. The error has the path of the first bad field as keys and indexes, the expected value and the kind of the found value.
- MINOR: a new entry, and each old export stays the same.
