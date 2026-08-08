import { TEACHER_SUPERVISOR_FORM_URL } from "../../config/clubApplications";

export function TeacherSupervisorFormSection({ required = true }) {
  return (
    <section className="panel">
      <h2>Section 2 · Teacher Supervisor Form</h2>
      <ol className="dialog-list">
        <li>Open the Teacher Supervisor Form.</li>
        <li>Print or complete it.</li>
        <li>Obtain the teacher supervisor’s signature.</li>
        <li>Upload a clear image of the completed and signed form.</li>
        <li>Submit the online application.</li>
      </ol>
      <p>
        <a
          className="button button--secondary"
          href={TEACHER_SUPERVISOR_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Teacher Supervisor Form
        </a>
      </p>
      {required ? (
        <p className="muted">
          A signed-form image upload is required before you can submit.
        </p>
      ) : null}
    </section>
  );
}
