const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix implicitly 'any' type on callbacks for setBooks, setUploads, setShelves
content = content.replace(/setBooks\(\(prev\) =>/g, 'setBooks((prev: BookType[]) =>');
content = content.replace(/setBooks\(prev =>/g, 'setBooks((prev: BookType[]) =>');

content = content.replace(/setUploads\(\(prev\) =>/g, 'setUploads((prev: UploadTask[]) =>');
content = content.replace(/setUploads\(prev =>/g, 'setUploads((prev: UploadTask[]) =>');

content = content.replace(/setShelves\(\(prev\) =>/g, 'setShelves((prev: ShelfType[]) =>');
content = content.replace(/setShelves\(prev =>/g, 'setShelves((prev: ShelfType[]) =>');

content = content.replace(/setIsSearchOpen\(\(prev\) =>/g, 'setIsSearchOpen((prev: boolean) =>');
content = content.replace(/setIsSearchOpen\(prev =>/g, 'setIsSearchOpen((prev: boolean) =>');

content = content.replace(/setVisibleCount\(\(prev\) =>/g, 'setVisibleCount((prev: number) =>');
content = content.replace(/setVisibleCount\(prev =>/g, 'setVisibleCount((prev: number) =>');

// Fix .map and .filter implicit any
content = content.replace(/\.map\(\(book\) =>/g, '.map((book: BookType) =>');
content = content.replace(/\.map\(book =>/g, '.map((book: BookType) =>');

content = content.replace(/\.map\(\(b\) =>/g, '.map((b: BookType) =>');
content = content.replace(/\.map\(b =>/g, '.map((b: BookType) =>');

content = content.replace(/\.filter\(\(b\) =>/g, '.filter((b: BookType) =>');
content = content.replace(/\.filter\(b =>/g, '.filter((b: BookType) =>');

content = content.replace(/\.map\(\(u\) =>/g, '.map((u: UploadTask) =>');
content = content.replace(/\.map\(u =>/g, '.map((u: UploadTask) =>');

content = content.replace(/\.map\(\(s\) =>/g, '.map((s: ShelfType) =>');
content = content.replace(/\.map\(s =>/g, '.map((s: ShelfType) =>');

content = content.replace(/\.filter\(\(s\) =>/g, '.filter((s: ShelfType) =>');
content = content.replace(/\.filter\(s =>/g, '.filter((s: ShelfType) =>');

// Fix sort callbacks
content = content.replace(/\.sort\(\(a, b\) =>/g, '.sort((a: BookType, b: BookType) =>');
content = content.replace(/\.sort\(\(a: any, b: any\) =>/g, '.sort((a: BookType, b: BookType) =>');

// Fix catch (e) implicitly any
content = content.replace(/catch \(e\)/g, 'catch (e: any)');
content = content.replace(/catch \(err\)/g, 'catch (err: any)');

// Fix reduce
content = content.replace(/\.reduce\(\(sum, b\) =>/g, '.reduce((sum: number, b: BookType) =>');

// Fix Array.from(e.dataTransfer.files) -> Array.from(e.dataTransfer.files) as File[]
content = content.replace(/Array\.from\(e\.dataTransfer\.files\)/g, '(Array.from(e.dataTransfer.files) as File[])');

// Fix if (!f.type.includes('pdf')) -> if (!(f as File).type.includes('pdf'))
content = content.replace(/if \(\!f\.type\.includes/g, 'if (!(f as File).type.includes');

// More fixes
content = content.replace(/const filteredBooks = books\.filter\(b =>/g, 'const filteredBooks = books.filter((b: BookType) =>');
content = content.replace(/const sortedBooks = \[\.\.\.filteredBooks\]\.sort\(\(a, b\) =>/g, 'const sortedBooks = [...filteredBooks].sort((a: BookType, b: BookType) =>');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed types in page.tsx');
