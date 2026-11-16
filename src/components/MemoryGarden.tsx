import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { futureNotes, memoryMoments } from '../content';

type Props = {
  onNext: () => void;
  onPrev: () => void;
};

type MemoryCard = {
  id: string;
  category: string;
  when: string;
  title: string;
  teaser: string;
  detail: string;
  keepsake: string;
};

const FUTURE_KEY = 'nasha-istoriya:future-note:v1';
const CUSTOM_MEMORIES_KEY = 'nasha-istoriya:custom-memories:v1';

function readCustomMoments(): MemoryCard[] {
  try {
    const raw = window.localStorage.getItem(CUSTOM_MEMORIES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is Record<string, unknown> => Boolean(value) && typeof value === 'object')
      .filter((value) => ['id', 'category', 'when', 'title', 'teaser', 'detail', 'keepsake'].every((key) => typeof value[key] === 'string'))
      .filter((value) => value.category === 'Наши заметки')
      .slice(0, 40) as MemoryCard[];
  } catch {
    return [];
  }
}

function readFutureChoice(): string | null {
  try {
    const saved = window.localStorage.getItem(FUTURE_KEY);
    return futureNotes.some((note) => note.id === saved) ? saved : null;
  } catch {
    return null;
  }
}

export default function MemoryGarden({ onNext, onPrev }: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [category, setCategory] = useState<string>('Все');
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [customMoments, setCustomMoments] = useState<MemoryCard[]>(readCustomMoments);
  const [newTitle, setNewTitle] = useState('');
  const [newDetail, setNewDetail] = useState('');
  const [futureChoice, setFutureChoice] = useState<string | null>(readFutureChoice);
  const [status, setStatus] = useState('');

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  const allMoments = useMemo<MemoryCard[]>(() => [...memoryMoments, ...customMoments], [customMoments]);
  const categories = useMemo(
    () => ['Все', ...Array.from(new Set(allMoments.map((moment) => moment.category)))],
    [allMoments]
  );
  const visibleMoments = useMemo(
    () => category === 'Все' ? allMoments : allMoments.filter((moment) => moment.category === category),
    [allMoments, category]
  );

  const chosenFuture = futureNotes.find((note) => note.id === futureChoice);

  const openRandomMoment = () => {
    if (!visibleMoments.length) return;
    const options = visibleMoments.filter((moment) => moment.id !== openedId);
    const pool = options.length ? options : visibleMoments;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    setOpenedId(selected.id);
    setStatus(`Открыто воспоминание: ${selected.title}`);
    window.setTimeout(() => {
      document.getElementById(`memory-${selected.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  const addCustomMoment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = newTitle.trim();
    const detail = newDetail.trim();
    if (!title || !detail) return;

    const moment: MemoryCard = {
      id: `custom-${Date.now()}`,
      category: 'Наши заметки',
      when: 'Добавлено вами',
      title: title.slice(0, 64),
      teaser: detail.length > 110 ? `${detail.slice(0, 107).trimEnd()}…` : detail,
      detail: detail.slice(0, 600),
      keepsake: 'Ещё одна страница нашей общей истории.',
    };
    const updated = [moment, ...customMoments].slice(0, 40);
    setCustomMoments(updated);
    setCategory('Все');
    setOpenedId(moment.id);
    setNewTitle('');
    setNewDetail('');
    try {
      window.localStorage.setItem(CUSTOM_MEMORIES_KEY, JSON.stringify(updated));
      setStatus(`Новое воспоминание «${moment.title}» добавлено и сохранено в этом браузере.`);
    } catch {
      setStatus(`Новое воспоминание «${moment.title}» добавлено до обновления страницы.`);
    }
  };

  const saveFutureChoice = (id: string) => {
    const nextValue = futureChoice === id ? null : id;
    setFutureChoice(nextValue);
    try {
      if (nextValue) window.localStorage.setItem(FUTURE_KEY, nextValue);
      else window.localStorage.removeItem(FUTURE_KEY);
    } catch {
      /* Если хранилище недоступно, выбор сохранится до обновления страницы. */
    }
    const note = futureNotes.find((item) => item.id === id);
    setStatus(nextValue ? `Идея «${note?.title ?? ''}» сохранена в этой капсуле на этом устройстве.` : 'Идея убрана из капсулы.');
  };

  return (
    <section className="scene memory-scene" aria-labelledby="memory-title">
      <div className="memory-atmosphere" aria-hidden="true">
        <span className="memory-orb orb-one" />
        <span className="memory-orb orb-two" />
        <span className="memory-orb orb-three" />
        <span className="memory-sparkle sparkle-one">✦</span>
        <span className="memory-sparkle sparkle-two">✧</span>
        <span className="memory-sparkle sparkle-three">♡</span>
      </div>

      <div className="memory-inner">
        <header className="memory-header">
          <p className="eyebrow">
            <span className="rule" aria-hidden="true" />
            маленькая капсула времени
            <span className="rule" aria-hidden="true" />
          </p>
          <h2 ref={titleRef} id="memory-title" tabIndex={-1}>Моменты, к которым хочется возвращаться</h2>
          <p className="memory-lead">
            Собрал здесь детали нашей истории — от первого сообщения до тех самых маленьких вещей,
            которые делают её нашей.
          </p>
          <div className="memory-header-actions">
            <button type="button" className="btn primary" onClick={openRandomMoment}>
              <span aria-hidden="true">✧</span>
              Открыть случайное воспоминание
            </button>
            <span className="memory-count">Моментов в капсуле: {allMoments.length} <span aria-hidden="true">♥</span></span>
          </div>
        </header>

        <section className="memory-collection" aria-labelledby="memory-collection-title">
          <div className="memory-section-heading">
            <div>
              <p className="memory-kicker">листай и выбирай</p>
              <h3 id="memory-collection-title">Наша коллекция</h3>
            </div>
            <span className="memory-section-count">{visibleMoments.length} / {allMoments.length}</span>
          </div>

          <div className="memory-filters" role="group" aria-label="Фильтр воспоминаний">
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                className={`memory-filter ${category === item ? 'is-active' : ''}`}
                aria-pressed={category === item}
                onClick={() => {
                  setCategory(item);
                  setOpenedId(null);
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="memory-grid">
            {visibleMoments.map((moment, index) => {
              const isOpen = openedId === moment.id;
              return (
                <article
                  className={`memory-card ${isOpen ? 'is-open' : ''}`}
                  id={`memory-${moment.id}`}
                  key={moment.id}
                  style={{ animationDelay: `${index * 65}ms` }}
                >
                  <div className="memory-card-topline">
                    <span className="memory-card-category">{moment.category}</span>
                    <span className="memory-card-heart" aria-hidden="true">♡</span>
                  </div>
                  <p className="memory-card-when">{moment.when}</p>
                  <h4>{moment.title}</h4>
                  <p className="memory-card-teaser">{moment.teaser}</p>
                  <div id={`memory-detail-${moment.id}`} className="memory-reveal" hidden={!isOpen}>
                    <p>{moment.detail}</p>
                    <p className="memory-keepsake">{moment.keepsake}</p>
                  </div>
                  <button
                    type="button"
                    className="memory-card-toggle"
                    aria-expanded={isOpen}
                    aria-controls={`memory-detail-${moment.id}`}
                    onClick={() => setOpenedId(isOpen ? null : moment.id)}
                  >
                    {isOpen ? 'Спрятать воспоминание' : 'Вспомнить этот момент'}
                    <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="memory-add" aria-labelledby="memory-add-title">
          <div className="memory-add-copy">
            <p className="memory-kicker">эта история всё ещё пишется</p>
            <h3 id="memory-add-title">Добавить наше воспоминание</h3>
            <p>Впиши момент, которого пока нет на этой странице. Он сохранится в этом браузере и будет виден здесь при следующих посещениях с этого устройства.</p>
          </div>
          <form className="memory-add-form" onSubmit={addCustomMoment}>
            <label>
              <span>Как назовём этот момент?</span>
              <input
                type="text"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                maxLength={64}
                placeholder="Например, наше маленькое приключение"
                required
              />
            </label>
            <label>
              <span>Что хочется запомнить?</span>
              <textarea
                value={newDetail}
                onChange={(event) => setNewDetail(event.target.value)}
                maxLength={600}
                rows={3}
                placeholder="Опиши этот момент своими словами…"
                required
              />
            </label>
            <div className="memory-add-footer">
              <small>Текст хранится только в локальном браузере.</small>
              <button type="submit" className="btn primary small">Сохранить момент <span aria-hidden="true">♡</span></button>
            </div>
          </form>
        </section>

        <section className="future-capsule" aria-labelledby="future-title">
          <div className="future-copy">
            <p className="memory-kicker">страницы впереди</p>
            <h3 id="future-title">А что мы напишем дальше?</h3>
            <p>
              Эти идеи ещё не воспоминания — это маленькие планы, из которых однажды могут вырасти
              новые главы нашей истории.
            </p>
            {chosenFuture && (
              <div className="future-saved" role="status">
                <span aria-hidden="true">♥</span>
                Сейчас в нашей капсуле: <strong>{chosenFuture.title}</strong>
              </div>
            )}
          </div>
          <div className="future-options">
            {futureNotes.map((note) => {
              const selected = futureChoice === note.id;
              return (
                <button
                  type="button"
                  key={note.id}
                  className={`future-note ${selected ? 'is-selected' : ''}`}
                  aria-pressed={selected}
                  onClick={() => saveFutureChoice(note.id)}
                >
                  <span className="future-note-symbol" aria-hidden="true">{note.symbol}</span>
                  <span className="future-note-copy">
                    <strong>{note.title}</strong>
                    <small>{note.text}</small>
                    <em>{selected ? 'Сохранено в капсуле' : 'Выбрать эту идею'}</em>
                  </span>
                  <span className="future-note-check" aria-hidden="true">{selected ? '♥' : '＋'}</span>
                </button>
              );
            })}
          </div>
        </section>

        <p className="sr-only" aria-live="polite">{status}</p>

        <div className="chapter-actions memory-actions">
          <button type="button" className="btn ghost" onClick={onPrev}>
            <span className="btn-arrow" aria-hidden="true">←</span>
            <span>Вернуться в фотоальбом</span>
          </button>
          <button type="button" className="btn primary" onClick={onNext}>
            <span>К письму для тебя</span>
            <span className="btn-arrow" aria-hidden="true">→</span>
          </button>
        </div>

        <p className="memory-footnote">Самое красивое в нашей истории — то, что она продолжается. <span aria-hidden="true">♡</span></p>
      </div>
    </section>
  );
}
