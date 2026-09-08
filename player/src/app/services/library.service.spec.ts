import { TestBed } from '@angular/core/testing';
import { LibraryService } from './library.service';
import { DbService } from './db.service';

describe('LibraryService Folder Deduplication', () => {
  let service: LibraryService;
  let db: DbService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LibraryService, DbService]
    });
    service = TestBed.inject(LibraryService);
    db = TestBed.inject(DbService);
  });

  it('should correctly normalize paths regardless of slashes or casing', () => {
    const p1 = service.normalizePath('C:\\Users\\Music\\');
    const p2 = service.normalizePath('c:/users/music');
    const p3 = service.normalizePath('C:/Users/Music///');

    expect(p1).toBe('c:/users/music');
    expect(p2).toBe('c:/users/music');
    expect(p3).toBe('c:/users/music');
    expect(p1).toBe(p2);
  });

  it('should allow two folders with the same name if their paths are different', async () => {
    // Clear any folders
    await db.folders.clear();

    // Add first folder named 'Music' located at 'C:\Users\John\Music'
    const folder1Handle: any = { name: 'Music' };
    const folder1Id = await db.folders.add({
      pathName: 'Music',
      path: 'C:\\Users\\John\\Music',
      handle: folder1Handle,
      lastScanned: 0
    });

    // Add second folder ALSO named 'Music' located at 'D:\Archive\Music'
    const folder2Handle: any = { name: 'Music' };
    const folder2Id = await db.folders.add({
      pathName: 'Music',
      path: 'D:\\Archive\\Music',
      handle: folder2Handle,
      lastScanned: 0
    });

    await service.loadLibrary();
    const loadedFolders = service.folders();

    expect(loadedFolders.length).toBe(2);
    expect(loadedFolders[0].pathName).toBe('Music');
    expect(loadedFolders[1].pathName).toBe('Music');
    expect(loadedFolders[0].path).toBe('C:\\Users\\John\\Music');
    expect(loadedFolders[1].path).toBe('D:\\Archive\\Music');
  });
});
