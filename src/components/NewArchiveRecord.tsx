
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './NewArchiveRecord.css'
import ArchiveCombobox from './ArchiveCombobox'

type Client = {
  client_id: string
  client_name: string
}

type NewArchiveRecordProps = {
  onClose: () => void
  onCreated: () => void

  categoryOptions: string[]
  hddAlphaOptions: string[]
  hddBetaOptions: string[]

  subCategory1Options: string[]
  subCategory2Options: string[]
  subCategory3Options: string[]

  crewOptions: string[]

  cityOptions: string[]
  stateOptions: string[]
}

function NewArchiveRecord({
  onClose,
  onCreated,
  categoryOptions,
  hddAlphaOptions,
  hddBetaOptions,
  subCategory1Options,
  subCategory2Options,
  subCategory3Options,
  crewOptions,
  cityOptions,
  stateOptions,
}: NewArchiveRecordProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [clientMode, setClientMode] =
    useState<'existing' | 'new'>('existing')

  const [loadingClients, setLoadingClients] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] = useState('')

  useEffect(() => {
    async function loadClients() {
      setLoadingClients(true)
      setError('')

      const { data, error } = await supabase
        .from('clients')
        .select('client_id, client_name')
        .order('client_name', {
          ascending: true,
        })

      if (error) {
        setError(error.message)
      } else {
        setClients(data ?? [])
      }

      setLoadingClients(false)
    }

    loadClients()
  }, [])

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setSubmitting(true)
    setError('')

    const form = new FormData(event.currentTarget)

    const clientId =
      clientMode === 'existing'
        ? String(form.get('client_id') || '').trim()
        : null

    const newClientName =
      clientMode === 'new'
        ? String(
            form.get('new_client_name') || '',
          ).trim()
        : null

    const { error } = await supabase.rpc(
      'create_archive_record',
      {
        p_client_id: clientId || null,
        p_new_client_name:
          newClientName || null,

        p_hdd_alpha:
          String(
            form.get('hdd_alpha') || '',
          ).trim() || null,

        p_hdd_beta:
          String(
            form.get('hdd_beta') || '',
          ).trim() || null,

        p_project:
          String(
            form.get('project') || '',
          ).trim(),

        p_year: Number(form.get('year')),

        p_division:
          String(
            form.get('division') || '',
          ).trim(),

        p_category:
          String(
            form.get('category') || '',
          ).trim(),

        p_sub_category_1:
          String(
            form.get('sub_category_1') || '',
          ).trim() || null,

        p_sub_category_2:
          String(
            form.get('sub_category_2') || '',
          ).trim() || null,

        p_sub_category_3:
          String(
            form.get('sub_category_3') || '',
          ).trim() || null,

        p_lead_crew:
          String(
            form.get('lead_crew') || '',
          ).trim() || null,

        p_asst_1:
          String(
            form.get('asst_1') || '',
          ).trim() || null,

        p_asst_2:
          String(
            form.get('asst_2') || '',
          ).trim() || null,

        p_asst_3:
          String(
            form.get('asst_3') || '',
          ).trim() || null,

        p_city:
          String(
            form.get('city') || '',
          ).trim() || null,

        p_state:
          String(
            form.get('state') || '',
          ).trim() || null,
      },
    )

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    onCreated()
  }

  return (
    <div
      className="new-record-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <aside
        className="new-record-panel"
        aria-label="Add new shoot"
      >
        {/* HEADER */}

        <header className="new-record-header">
          <div>
            <p className="new-record-eyebrow">
              PHX ARCHIVE
            </p>

            <h2>Add New Shoot</h2>

            <p>Create a new archive record.</p>
          </div>

          <button
            type="button"
            className="new-record-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <form
          className="new-record-form"
          onSubmit={handleSubmit}
        >
          {/* CLIENT */}

          <section className="new-record-section">
            <div className="new-record-section-heading">
              Client
            </div>

            <div className="client-mode-toggle">
              <button
                type="button"
                className={
                  clientMode === 'existing'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setClientMode('existing')
                }
              >
                Existing Client
              </button>

              <button
                type="button"
                className={
                  clientMode === 'new'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setClientMode('new')
                }
              >
                New Client
              </button>
            </div>

            {clientMode === 'existing' ? (
              <div className="form-field full-width">
                <label htmlFor="client_id">
                  Client
                </label>

                <select
                  id="client_id"
                  name="client_id"
                  required
                  disabled={loadingClients}
                  defaultValue=""
                >
                  <option
                    value=""
                    disabled
                  >
                    {loadingClients
                      ? 'Loading clients…'
                      : 'Select client'}
                  </option>

                  {clients.map((client) => (
                    <option
                      key={client.client_id}
                      value={client.client_id}
                    >
                      {client.client_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-field full-width">
                <label htmlFor="new_client_name">
                  New Client Name
                </label>

                <input
                  id="new_client_name"
                  name="new_client_name"
                  type="text"
                  placeholder="Enter client name"
                  required
                />
              </div>
            )}
          </section>

          {/* SHOOT */}

          <section className="new-record-section">
            <div className="new-record-section-heading">
              Shoot
            </div>

            <div className="form-grid">
              <div className="form-field full-width">
                <label htmlFor="project">
                  Project
                </label>

                <input
                  id="project"
                  name="project"
                  type="text"
                  placeholder="Project name"
                  required
                />
              </div>
<div className="form-field">
  <label htmlFor="year">
    Year
  </label>

  <input
    id="year"
    name="year"
    type="text"
    inputMode="numeric"
    placeholder="YYYY"
    defaultValue={String(
      new Date().getFullYear(),
    )}
    required
  />
</div>

              <div className="form-field">
                <label htmlFor="division">
                  Division
                </label>

                <select
                  id="division"
                  name="division"
                  defaultValue=""
                  required
                >
                  <option
                    value=""
                    disabled
                  >
                    Select division
                  </option>

                  <option value="PHX">PHX</option>
                  <option value="SFX">SFX</option>
                  <option value="DRONE">
                    DRONE
                  </option>
                </select>
              </div>

              <div className="form-field full-width">
                <label htmlFor="category">
                  Category
                </label>

                <ArchiveCombobox
                  id="category"
                  name="category"
                  options={categoryOptions}
                  placeholder="Select or type a category"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="hdd_alpha">
                  HDD Alpha
                </label>

                <ArchiveCombobox
                  id="hdd_alpha"
                  name="hdd_alpha"
                  options={hddAlphaOptions}
                  placeholder="Select or type"
                />
              </div>

              <div className="form-field">
                <label htmlFor="hdd_beta">
                  HDD Beta
                </label>

                <ArchiveCombobox
                  id="hdd_beta"
                  name="hdd_beta"
                  options={hddBetaOptions}
                  placeholder="Select or type"
                />
              </div>
            </div>
          </section>

          {/* CLASSIFICATION */}

          <section className="new-record-section">
            <div className="new-record-section-heading">
              Classification
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="sub_category_1">
                  Sub-category 1
                </label>

                <ArchiveCombobox
                  id="sub_category_1"
                  name="sub_category_1"
                  options={subCategory1Options}
                  placeholder="Select or type"
                />
              </div>

              <div className="form-field">
                <label htmlFor="sub_category_2">
                  Sub-category 2
                </label>

                <ArchiveCombobox
                  id="sub_category_2"
                  name="sub_category_2"
                  options={subCategory2Options}
                  placeholder="Select or type"
                />
              </div>

              <div className="form-field full-width">
                <label htmlFor="sub_category_3">
                  Sub-category 3
                </label>

                <ArchiveCombobox
                  id="sub_category_3"
                  name="sub_category_3"
                  options={subCategory3Options}
                  placeholder="Select or type"
                />
              </div>
            </div>
          </section>

          {/* CREW */}

          <section className="new-record-section">
            <div className="new-record-section-heading">
              Crew
            </div>

            <div className="form-grid">
              <div className="form-field full-width">
                <label htmlFor="lead_crew">
                  Lead Crew
                </label>

                <ArchiveCombobox
                  id="lead_crew"
                  name="lead_crew"
                  options={crewOptions}
                  placeholder="Select or type"
                />
              </div>

              <div className="form-field">
                <label htmlFor="asst_1">
                  Assistant 1
                </label>

                <ArchiveCombobox
                  id="asst_1"
                  name="asst_1"
                  options={crewOptions}
                  placeholder="Select or type"
                />
              </div>

              <div className="form-field">
                <label htmlFor="asst_2">
                  Assistant 2
                </label>

                <ArchiveCombobox
                  id="asst_2"
                  name="asst_2"
                  options={crewOptions}
                  placeholder="Select or type"
                />
              </div>

              <div className="form-field full-width">
                <label htmlFor="asst_3">
                  Assistant 3
                </label>

                <ArchiveCombobox
                  id="asst_3"
                  name="asst_3"
                  options={crewOptions}
                  placeholder="Select or type"
                />
              </div>
            </div>
          </section>

          {/* LOCATION */}

          <section className="new-record-section">
            <div className="new-record-section-heading">
              Location
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="city">City</label>

                <ArchiveCombobox
                  id="city"
                  name="city"
                  options={cityOptions}
                  placeholder="Select or type"
                />
              </div>

              <div className="form-field">
                <label htmlFor="state">State</label>

                <ArchiveCombobox
                  id="state"
                  name="state"
                  options={stateOptions}
                  placeholder="Select or type"
                />
              </div>
            </div>
          </section>

          {/* ERROR */}

          {error && (
            <div className="new-record-error">
              {error}
            </div>
          )}

          {/* FOOTER */}

          <footer className="new-record-footer">
            <button
              type="button"
              className="new-record-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="new-record-submit"
              disabled={
                submitting || loadingClients
              }
            >
              {submitting
                ? 'Creating…'
                : 'Create Shoot'}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  )
}

export default NewArchiveRecord

