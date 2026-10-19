import { Rich } from '../../engine/Tex';

/**
 * Opening card of a lesson: the question the class answers, then its steps in order (the labels
 * of its blackboard lines). NÓESIS says the context in the console meanwhile.
 */
export function LessonIntro({
  question,
  steps,
  reduced,
}: {
  question: string;
  steps: string[];
  reduced: boolean;
}) {
  return (
    <div className={`lesson-intro ${reduced ? '' : 'animate'}`}>
      <h2 className="li-question">
        <Rich text={question} />
      </h2>
      {steps.length > 1 && (
        <ol className="li-steps">
          {steps.map((s, i) => (
            <li key={s} style={{ ['--i' as string]: i }}>
              <Rich text={s} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
