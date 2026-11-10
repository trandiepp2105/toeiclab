import { useEffect, useRef, useState } from "react";
import "./TopicSelect.scss";

/**
 * A keyboard-accessible topic picker for the vocabulary quiz setup.
 *
 * @param {Object} props Component properties.
 * @param {Array<{id: number|string, name: string, count?: number}>} props.topics Available vocabulary topics.
 * @param {string|number} props.value Currently selected topic ID.
 * @param {(topicId: string|number) => void} props.onChange Reports a selected topic ID.
 * @returns {JSX.Element} A custom combobox with a scrollable listbox popup.
 */
function TopicSelect({ topics = [], value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const optionRefs = useRef([]);
  const selectedIndex = topics.findIndex(
    (topic) => String(topic.id) === String(value),
  );
  const selectedTopic = selectedIndex >= 0 ? topics[selectedIndex] : null;
  const activeTopic = topics[activeIndex];

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function closeOnOutsideClick(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [isOpen]);

  function openList() {
    if (!topics.length) {
      return;
    }

    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  }

  function selectTopic(topic) {
    onChange(topic.id);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        openList();
        return;
      }
      setActiveIndex((index) => Math.min(index + 1, topics.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        openList();
        return;
      }
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Home" && isOpen) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === "End" && isOpen) {
      event.preventDefault();
      setActiveIndex(topics.length - 1);
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && isOpen) {
      event.preventDefault();
      if (activeTopic) {
        selectTopic(activeTopic);
      }
      return;
    }

    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, isOpen]);

  return (
    <div className={`topic-select ${isOpen ? "is-open" : ""}`} ref={containerRef}>
      <label className="topic-select-label" htmlFor="vocabulary-topic-select">
        Chủ đề từ vựng
      </label>
      <div className="topic-select-control">
        <input
          ref={inputRef}
          id="vocabulary-topic-select"
          className="topic-select-input"
          type="text"
          role="combobox"
          aria-autocomplete="none"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="vocabulary-topic-options"
          aria-activedescendant={
            isOpen && activeTopic
              ? `vocabulary-topic-option-${activeTopic.id}`
              : undefined
          }
          aria-label="Chọn chủ đề từ vựng"
          placeholder="Chọn chủ đề…"
          value={selectedTopic?.name || ""}
          readOnly
          onClick={() => (isOpen ? setIsOpen(false) : openList())}
          onKeyDown={handleKeyDown}
        />
        <span className="topic-select-chevron" aria-hidden="true">
          <svg viewBox="0 0 20 20" focusable="false">
            <path d="m5.5 7.5 4.5 4.5 4.5-4.5" />
          </svg>
        </span>
      </div>

      {isOpen && (
        <div
          className="topic-select-menu"
          id="vocabulary-topic-options"
          role="listbox"
          aria-label="Danh sách chủ đề"
        >
          {topics.map((topic, index) => {
            const isSelected = index === selectedIndex;
            const isActive = index === activeIndex;

            return (
              <button
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                className={`topic-select-option ${
                  isActive ? "is-active" : ""
                } ${isSelected ? "is-selected" : ""}`}
                id={`vocabulary-topic-option-${topic.id}`}
                key={topic.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectTopic(topic)}
              >
                <span className="topic-select-option-name">{topic.name}</span>
                {(topic.count !== undefined || isSelected) && (
                  <span className="topic-select-option-meta">
                    {topic.count !== undefined && <>{topic.count} từ</>}
                    {isSelected && (
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                      <path d="m4.5 10.5 3.5 3.5 7.5-8" />
                    </svg>
                    )}
                  </span>
                )}
              </button>
            );
          })}
          {!topics.length && (
            <p className="topic-select-empty">Chưa có chủ đề từ vựng.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default TopicSelect;
