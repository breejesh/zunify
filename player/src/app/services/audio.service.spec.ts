import { TestBed } from '@angular/core/testing';
import { AudioService } from './audio.service';
import { LibraryService } from './library.service';
import { DbService, TrackRecord } from './db.service';

describe('AudioService Repeat & Queue Management', () => {
  let service: AudioService;
  let libraryService: jasmine.SpyObj<LibraryService>;
  let dbService: jasmine.SpyObj<DbService>;

  const mockTracks: TrackRecord[] = [
    {
      id: 1,
      title: 'Track 1',
      artist: 'Artist 1',
      album: 'Album 1',
      genre: 'Rock',
      duration: 180,
      filePath: 'demo:track-1',
      folderId: 0,
      heart: 0,
      playCount: 5
    },
    {
      id: 2,
      title: 'Track 2',
      artist: 'Artist 2',
      album: 'Album 2',
      genre: 'Rock',
      duration: 200,
      filePath: 'demo:track-2',
      folderId: 0,
      heart: 0,
      playCount: 10
    },
    {
      id: 3,
      title: 'Track 3',
      artist: 'Artist 3',
      album: 'Album 3',
      genre: 'Rock',
      duration: 220,
      filePath: 'demo:track-3',
      folderId: 0,
      heart: 0,
      playCount: 2
    }
  ];

  beforeEach(() => {
    const libSpy = jasmine.createSpyObj('LibraryService', ['getTrackFile', 'updateTrackPlayCount']);
    const dbSpy = jasmine.createSpyObj('DbService', ['incrementPlayCount', 'tracks']);
    dbSpy.tracks = jasmine.createSpyObj('Table', ['update']);

    TestBed.configureTestingModule({
      providers: [
        AudioService,
        { provide: LibraryService, useValue: libSpy },
        { provide: DbService, useValue: dbSpy }
      ]
    });

    service = TestBed.inject(AudioService);
    libraryService = TestBed.inject(LibraryService) as jasmine.SpyObj<LibraryService>;
    dbService = TestBed.inject(DbService) as jasmine.SpyObj<DbService>;

    // Mock HTMLAudioElement methods to prevent real media errors in headless environments
    const audioEl = (service as any).audio;
    if (audioEl) {
      spyOn(audioEl, 'play').and.returnValue(Promise.resolve());
      spyOn(audioEl, 'pause').and.callFake(() => {});
      spyOn(audioEl, 'load').and.callFake(() => {});
    }
  });

  it('should toggle repeat states: off -> all -> one -> off', () => {
    service.repeat.set('off');
    expect(service.repeat()).toBe('off');

    service.toggleRepeat();
    expect(service.repeat()).toBe('all');
    // Ensure native loop is never enabled so 'ended' events always fire
    expect((service as any).audio.loop).toBeFalse();

    service.toggleRepeat();
    expect(service.repeat()).toBe('one');
    expect((service as any).audio.loop).toBeFalse();

    service.toggleRepeat();
    expect(service.repeat()).toBe('off');
    expect((service as any).audio.loop).toBeFalse();
  });

  it('should play a track at specific queue index using playQueueIndex()', async () => {
    await service.playTrack(mockTracks[0], mockTracks);
    expect(service.currentIndex()).toBe(0);
    expect(service.currentTrack()?.id).toBe(1);

    service.playQueueIndex(2);
    expect(service.currentIndex()).toBe(2);
    expect(service.currentTrack()?.id).toBe(3);
  });

  it('should advance through playlist when repeat is off, and stop at the end', async () => {
    service.repeat.set('off');
    await service.playTrack(mockTracks[0], mockTracks);
    expect(service.currentIndex()).toBe(0);

    service.next();
    expect(service.currentIndex()).toBe(1);

    service.next();
    expect(service.currentIndex()).toBe(2);

    // Reached end of queue with repeat off: should not wrap around
    service.next();
    expect(service.currentIndex()).toBe(2);
  });

  it('should wrap around to track 0 when repeat is all and end of playlist is reached', async () => {
    service.repeat.set('all');
    await service.playTrack(mockTracks[0], mockTracks);

    service.currentIndex.set(2); // Last track
    service.next();

    expect(service.currentIndex()).toBe(0);
    expect(service.currentTrack()?.id).toBe(1);
  });

  it('should replay the same track when repeat is one upon song ending', async () => {
    service.repeat.set('one');
    await service.playTrack(mockTracks[1], mockTracks);
    expect(service.currentIndex()).toBe(1);

    const replaySpy = spyOn(service, 'replayCurrentTrack').and.callThrough();
    const loadSpy = spyOn<any>(service, 'loadAndPlay').and.returnValue(Promise.resolve());

    // Simulate song ending event
    (service as any).handleSongEnded();

    expect(replaySpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalledWith(mockTracks[1]);
  });

  it('should call next() upon song ending when repeat is all', async () => {
    service.repeat.set('all');
    await service.playTrack(mockTracks[0], mockTracks);

    const nextSpy = spyOn(service, 'next').and.callThrough();

    (service as any).handleSongEnded();

    expect(nextSpy).toHaveBeenCalled();
    expect(service.currentIndex()).toBe(1);
  });
});
