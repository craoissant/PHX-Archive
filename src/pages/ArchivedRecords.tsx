import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useArchiveRole } from '../hooks/useArchiveRole'
import './ArchivedRecords.css'


type ArchivedRecord = {
  archive_id: string
  client_id: string
  client_name: string
  hdd_alpha: string
  hdd_beta: string
  project: string
  year: number
  division: string
  category: string
  sub_category_1: string | null
  sub_category_2: string | null
  sub_category_3: string | null
  lead_crew: string | null
  asst_1: string | null
  asst_2: string | null
  asst_3: string | null
  city: string | null
  state: string | null
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
  deleted_at: string
  deleted_by: string | null
}

function ArchivedRecords() {
  const navigate = useNavigate()
  const { loading: roleLoading, isAdmin } = useArchiveRole()

  const [records, setRecords] = useState<ArchivedRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restoringRecord, setRestoringRecord] =
    useState<ArchivedRecord | null>(null)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    if (roleLoading) return

    if (!isAdmin) {
      navigate('/archive', { replace: true })
      return
    }

    const loadArchivedRecords = async () => {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.rpc(
        'get_archived_records'
      )

      if (error) {
        console.error(
          'Failed to load archived records:',
          error
        )
        setError(error.message)
        setRecords([])
      } else {
        setRecords((data ?? []) as ArchivedRecord[])
      }

      setLoading(false)
    }

    loadArchivedRecords()
  }, [isAdmin, roleLoading, navigate])

  const handleRestore = async () => {
    if (!restoringRecord) return

    setRestoring(true)
    setError(null)

    const { error } = await supabase.rpc(
      'restore_archive_record',
      {
        p_archive_id: restoringRecord.archive_id,
      }
    )

    if (error) {
      console.error(
        'Failed to restore archive record:',
        error
      )
      setError(error.message)
      setRestoring(false)
      return
    }

    setRecords((currentRecords) =>
      currentRecords.filter(
        (record) =>
          record.archive_id !==
          restoringRecord.archive_id
      )
    )

    setRestoringRecord(null)
    setRestoring(false)
  }

  if (roleLoading || loading) {
    return (
      <div className="archived-page">
        <div className="archived-loading">
          Loading archived records…
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="archived-page">
      <header className="archived-header">
        <div className="archived-header-top">
          <div>
            <p className="archived-eyebrow">
              PHX ARCHIVE
            </p>

            <h1 className="archived-title">
              Archived Records
            </h1>

            <p className="archived-subtitle">
              Records removed from the active archive.
            </p>
          </div>

          <button
            type="button"
            className="archived-back-button"
            onClick={() => navigate('/archive')}
          >
            Back to Archive
          </button>
        </div>
      </header>

      <main className="archived-content">
        {error && (
          <div className="archived-error">
            {error}
          </div>
        )}

        <div className="archived-summary">
          <span>
            {records.length}{' '}
            {records.length === 1
              ? 'record'
              : 'records'}
          </span>
        </div>

        {records.length === 0 ? (
          <section className="archived-empty">
            <p className="archived-empty-label">
              ARCHIVE CLEAR
            </p>

            <h2>
              No archived records
            </h2>

            <p>
              Records archived from the active database
              will appear here.
            </p>
          </section>
        ) : (
          <section className="archived-table-wrapper">
            <table className="archived-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Year</th>
                  <th>Division</th>
                  <th>Category</th>
                  <th>Archived</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr key={record.archive_id}>
                    <td>
                      <div className="archived-project">
                        {record.project}
                      </div>

                      <div className="archived-meta">
                        {record.city || '—'}
                        {record.state
                          ? `, ${record.state}`
                          : ''}
                      </div>
                    </td>

                    <td>
                      {record.client_name}
                    </td>

                    <td>
                      {record.year}
                    </td>

                    <td>
                      <span className="archived-division">
                        {record.division}
                      </span>
                    </td>

                    <td>
                      {record.category}
                    </td>

                    <td>
                      <div className="archived-date">
                        {new Date(
                          record.deleted_at
                        ).toLocaleDateString(
                          'en-IN',
                          {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          }
                        )}
                      </div>

                      <div className="archived-time">
                        {new Date(
                          record.deleted_at
                        ).toLocaleTimeString(
                          'en-IN',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </div>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="archived-restore-button"
                        onClick={() =>
                          setRestoringRecord(record)
                        }
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>

      {restoringRecord && (
        <div className="archived-confirm-overlay">
          <div
            className="archived-confirm-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restore-title"
          >
            <p className="archived-confirm-eyebrow">
              RESTORE RECORD
            </p>

            <h2 id="restore-title">
              Restore this record?
            </h2>

            <p className="archived-confirm-description">
              This will return the record to the active
              archive.
            </p>

            <div className="archived-confirm-record">
              <strong>
                {restoringRecord.project}
              </strong>

              <span>
                {restoringRecord.division} ·{' '}
                {restoringRecord.year} ·{' '}
                {restoringRecord.category}
              </span>
            </div>

            <div className="archived-confirm-actions">
              <button
                type="button"
                className="archived-confirm-cancel"
                onClick={() =>
                  setRestoringRecord(null)
                }
                disabled={restoring}
              >
                Cancel
              </button>

              <button
                type="button"
                className="archived-confirm-submit"
                onClick={handleRestore}
                disabled={restoring}
              >
                {restoring
                  ? 'Restoring…'
                  : 'Restore record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ArchivedRecords