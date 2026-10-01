import { useEffect, useMemo, useState } from 'react'
import Fuse from 'fuse.js'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useArchiveRole } from '../hooks/useArchiveRole'
import NewArchiveRecord from '../components/NewArchiveRecord'
import './Archive.css'


type ArchiveRecord = {
  archive_id: string
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
  client_id: string
  clients: {
    client_name: string
  } | null
}

const PAGE_SIZE = 50

function Archive() {
  const { session } = useAuth()
  const { role, loading: roleLoading, isAdmin } =
    useArchiveRole()

  const [records, setRecords] = useState<ArchiveRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')

  const [yearFilter, setYearFilter] = useState('')
  const [divisionFilter, setDivisionFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [mainCrewFilter, setMainCrewFilter] = useState('')
  const [assistantCrewFilter, setAssistantCrewFilter] =
    useState('')
  const [subCategoryFilter, setSubCategoryFilter] =
    useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [hddAlphaFilter, setHddAlphaFilter] = useState('')
  const [hddBetaFilter, setHddBetaFilter] = useState('')
  const [page, setPage] = useState(1)

  const [selectedRecord, setSelectedRecord] =
    useState<ArchiveRecord | null>(null)

  const [editingRecord, setEditingRecord] =
    useState<ArchiveRecord | null>(null)

  const [archivingRecord, setArchivingRecord] =
    useState<ArchiveRecord | null>(null)

  const [archiving, setArchiving] = useState(false)

  const [showNewRecord, setShowNewRecord] =
    useState(false)

  /*
   * --------------------------------------------------------------------------
   * Load archive records
   * --------------------------------------------------------------------------
   */

  async function loadRecords() {
    setLoading(true)
    setError('')

    const BATCH_SIZE = 1000
    let from = 0
    const allData: any[] = []

    try {
      while (true) {
        const { data, error } = await supabase
          .from('archive_records')
          .select(`
            archive_id,
            client_id,
            hdd_alpha,
            hdd_beta,
            project,
            year,
            division,
            category,
            sub_category_1,
            sub_category_2,
            sub_category_3,
            lead_crew,
            asst_1,
            asst_2,
            asst_3,
            city,
            state,
            clients (
              client_name
            )
          `)
          .order('year', { ascending: false })
          .order('project', { ascending: true })
          .order('archive_id', { ascending: true })
          .range(from, from + BATCH_SIZE - 1)

        if (error) {
          throw error
        }

        if (!data || data.length === 0) {
          break
        }

        allData.push(...data)

        if (data.length < BATCH_SIZE) {
          break
        }

        from += BATCH_SIZE
      }

      const normalizedRecords: ArchiveRecord[] =
        allData.map((record) => ({
          archive_id: record.archive_id,
          hdd_alpha: record.hdd_alpha ?? '',
          hdd_beta: record.hdd_beta ?? '',
          project: record.project ?? '',
          year: record.year,
          division: record.division ?? '',
          category: record.category ?? '',
          sub_category_1:
            record.sub_category_1 ?? null,
          sub_category_2:
            record.sub_category_2 ?? null,
          sub_category_3:
            record.sub_category_3 ?? null,
          lead_crew: record.lead_crew ?? null,
          asst_1: record.asst_1 ?? null,
          asst_2: record.asst_2 ?? null,
          asst_3: record.asst_3 ?? null,
          city: record.city ?? null,
          state: record.state ?? null,
          client_id: record.client_id,
          clients: record.clients
            ? {
                client_name:
                  record.clients.client_name ?? '',
              }
            : null,
        }))

      setRecords(normalizedRecords)
      setPage(1)
    } catch (error) {
      console.error(
        'Error loading archive records:',
        error,
      )

      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load archive records.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      loadRecords()
    }
  }, [session])

  /*
   * --------------------------------------------------------------------------
   * Search
   * --------------------------------------------------------------------------
   */

  const fuse = useMemo(() => {
    return new Fuse(records, {
      keys: [
        {
          name: 'clients.client_name',
          weight: 2,
        },
        {
          name: 'project',
          weight: 2,
        },
        {
          name: 'category',
          weight: 1.5,
        },
        {
          name: 'sub_category_1',
          weight: 1.2,
        },
        {
          name: 'sub_category_2',
          weight: 1.2,
        },
        {
          name: 'sub_category_3',
          weight: 1.2,
        },
        {
          name: 'lead_crew',
          weight: 1,
        },
        {
          name: 'asst_1',
          weight: 0.8,
        },
        {
          name: 'asst_2',
          weight: 0.8,
        },
        {
          name: 'asst_3',
          weight: 0.8,
        },
        {
          name: 'city',
          weight: 1,
        },
        {
          name: 'state',
          weight: 1,
        },
        {
          name: 'hdd_alpha',
          weight: 0.8,
        },
        {
          name: 'hdd_beta',
          weight: 0.8,
        },
        {
          name: 'division',
          weight: 1,
        },
        {
          name: 'year',
          weight: 0.5,
        },
      ],
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
    })
  }, [records])

  const searchedRecords = useMemo(() => {
    if (!search.trim()) {
      return records
    }

    return fuse.search(search.trim()).map(
      (result) => result.item,
    )
  }, [records, search, fuse])

  /*
   * --------------------------------------------------------------------------
   * Filters
   * --------------------------------------------------------------------------
   */

  const filteredRecords = useMemo(() => {
    return searchedRecords.filter((record) => {
      if (
        yearFilter &&
        String(record.year) !== yearFilter
      ) {
        return false
      }

      if (
        divisionFilter &&
        record.division !== divisionFilter
      ) {
        return false
      }

      if (
        categoryFilter &&
        record.category !== categoryFilter
      ) {
        return false
      }

      // Main Crew filter
      if (
        mainCrewFilter &&
        record.lead_crew?.trim().toLowerCase() !==
          mainCrewFilter.trim().toLowerCase()
      ) {
        return false
      }

      // Assistant Crew filter
      if (
        assistantCrewFilter &&
        ![
          record.asst_1,
          record.asst_2,
          record.asst_3,
        ].some(
          (crew) =>
            crew?.trim().toLowerCase() ===
            assistantCrewFilter.trim().toLowerCase(),
        )
      ) {
        return false
      }

      if (subCategoryFilter) {
        const matchesSubCategory =
          record.sub_category_1 ===
            subCategoryFilter ||
          record.sub_category_2 ===
            subCategoryFilter ||
          record.sub_category_3 ===
            subCategoryFilter

        if (!matchesSubCategory) {
          return false
        }
      }

      if (
        cityFilter &&
        record.city !== cityFilter
      ) {
        return false
      }

      if (
        stateFilter &&
        record.state !== stateFilter
      ) {
        return false
      }

      if (
        hddAlphaFilter &&
        record.hdd_alpha !== hddAlphaFilter
      ) {
        return false
      }

      if (
        hddBetaFilter &&
        record.hdd_beta !== hddBetaFilter
      ) {
        return false
      }

      return true
    })
  }, [
    searchedRecords,
    yearFilter,
    divisionFilter,
    categoryFilter,
    mainCrewFilter,
    assistantCrewFilter,
    subCategoryFilter,
    cityFilter,
    stateFilter,
    hddAlphaFilter,
    hddBetaFilter,
  ])

  /*
   * --------------------------------------------------------------------------
   * Filter options
   * --------------------------------------------------------------------------
   */

  const years = useMemo(() => {
    return Array.from(
      new Set(
        records.map((record) => record.year),
      ),
    ).sort((a, b) => b - a)
  }, [records])

  const divisions = useMemo(() => {
    return Array.from(
      new Set(
        records.map((record) => record.division),
      ),
    ).sort()
  }, [records])

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        records.map((record) => record.category),
      ),
    ).sort()
  }, [records])

  const subCategories = useMemo(() => {
    return Array.from(
      new Set(
        records.flatMap((record) =>
          [
            record.sub_category_1,
            record.sub_category_2,
            record.sub_category_3,
          ].filter(
            (value): value is string =>
              Boolean(value),
          ),
        ),
      ),
    ).sort()
  }, [records])

  const subCategory1Options = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map(
            (record) =>
              record.sub_category_1,
          )
          .filter(
            (value): value is string =>
              Boolean(value),
          ),
      ),
    ).sort()
  }, [records])

  const subCategory2Options = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map(
            (record) =>
              record.sub_category_2,
          )
          .filter(
            (value): value is string =>
              Boolean(value),
          ),
      ),
    ).sort()
  }, [records])

  const subCategory3Options = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map(
            (record) =>
              record.sub_category_3,
          )
          .filter(
            (value): value is string =>
              Boolean(value),
          ),
      ),
    ).sort()
  }, [records])

  const mainCrewOptions = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map(
            (record) =>
              record.lead_crew,
          )
          .filter(
            (value): value is string =>
              Boolean(value),
          ),
      ),
    ).sort()
  }, [records])

  const assistantCrewOptions = useMemo(() => {
    return Array.from(
      new Set(
        records
          .flatMap((record) => [
            record.asst_1,
            record.asst_2,
            record.asst_3,
          ])
          .filter(
            (value): value is string =>
              Boolean(value),
          ),
      ),
    ).sort()
  }, [records])

  // Combined crew list used by NewArchiveRecord
  const crewOptions = useMemo(() => {
    return Array.from(
      new Set([
        ...mainCrewOptions,
        ...assistantCrewOptions,
      ]),
    ).sort()
  }, [
    mainCrewOptions,
    assistantCrewOptions,
  ])

  const cities = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map((record) => record.city)
          .filter(
            (city): city is string =>
              Boolean(city),
          ),
      ),
    ).sort()
  }, [records])

  const states = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map((record) => record.state)
          .filter(
            (state): state is string =>
              Boolean(state),
          ),
      ),
    ).sort()
  }, [records])

  const hddAlphas = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map(
            (record) =>
              record.hdd_alpha,
          )
          .filter(Boolean),
      ),
    ).sort()
  }, [records])

  const hddBetas = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map(
            (record) =>
              record.hdd_beta,
          )
          .filter(Boolean),
      ),
    ).sort()
  }, [records])

  /*
   * --------------------------------------------------------------------------
   * Pagination
   * --------------------------------------------------------------------------
   */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRecords.length / PAGE_SIZE,
    ),
  )

  const paginatedRecords = useMemo(() => {
    const from =
      (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE

    return filteredRecords.slice(from, to)
  }, [filteredRecords, page])

  useEffect(() => {
    setPage(1)
  }, [
    search,
    yearFilter,
    divisionFilter,
    categoryFilter,
    mainCrewFilter,
    assistantCrewFilter,
    subCategoryFilter,
    cityFilter,
    stateFilter,
    hddAlphaFilter,
    hddBetaFilter,
  ])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  /*
   * --------------------------------------------------------------------------
   * Clear filters
   * --------------------------------------------------------------------------
   */

  function clearFilters() {
    setSearch('')
    setYearFilter('')
    setDivisionFilter('')
    setCategoryFilter('')
    setMainCrewFilter('')
    setAssistantCrewFilter('')
    setSubCategoryFilter('')
    setCityFilter('')
    setStateFilter('')
    setHddAlphaFilter('')
    setHddBetaFilter('')
    setPage(1)
  }

  /*
   * --------------------------------------------------------------------------
   * Update record
   * --------------------------------------------------------------------------
   */

  async function handleUpdateRecord(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!editingRecord) {
      return
    }

    const formData = new FormData(
      event.currentTarget,
    )

    const updatedValues = {
      hdd_alpha: String(
        formData.get('hdd_alpha') ?? '',
      ),
      hdd_beta: String(
        formData.get('hdd_beta') ?? '',
      ),
      project: String(
        formData.get('project') ?? '',
      ),
      year: Number(
        formData.get('year'),
      ),
      division: String(
        formData.get('division') ?? '',
      ),
      category: String(
        formData.get('category') ?? '',
      ),
      sub_category_1:
        formData.get('sub_category_1')
          ? String(
              formData.get(
                'sub_category_1',
              ),
            )
          : null,
      sub_category_2:
        formData.get('sub_category_2')
          ? String(
              formData.get(
                'sub_category_2',
              ),
            )
          : null,
      sub_category_3:
        formData.get('sub_category_3')
          ? String(
              formData.get(
                'sub_category_3',
              ),
            )
          : null,
      lead_crew:
        formData.get('lead_crew')
          ? String(
              formData.get('lead_crew'),
            )
          : null,
      asst_1:
        formData.get('asst_1')
          ? String(
              formData.get('asst_1'),
            )
          : null,
      asst_2:
        formData.get('asst_2')
          ? String(
              formData.get('asst_2'),
            )
          : null,
      asst_3:
        formData.get('asst_3')
          ? String(
              formData.get('asst_3'),
            )
          : null,
      city:
        formData.get('city')
          ? String(
              formData.get('city'),
            )
          : null,
      state:
        formData.get('state')
          ? String(
              formData.get('state'),
            )
          : null,
    }

    const { error } =
      await supabase.rpc(
        'update_archive_record',
        {
          p_archive_id:
            editingRecord.archive_id,
          p_client_id:
            editingRecord.client_id,
          p_hdd_alpha:
            updatedValues.hdd_alpha,
          p_hdd_beta:
            updatedValues.hdd_beta,
          p_project:
            updatedValues.project,
          p_year:
            updatedValues.year,
          p_division:
            updatedValues.division,
          p_category:
            updatedValues.category,
          p_sub_category_1:
            updatedValues.sub_category_1,
          p_sub_category_2:
            updatedValues.sub_category_2,
          p_sub_category_3:
            updatedValues.sub_category_3,
          p_lead_crew:
            updatedValues.lead_crew,
          p_asst_1:
            updatedValues.asst_1,
          p_asst_2:
            updatedValues.asst_2,
          p_asst_3:
            updatedValues.asst_3,
          p_city:
            updatedValues.city,
          p_state:
            updatedValues.state,
        },
      )

    if (error) {
      console.error(
        'Update failed:',
        error,
      )
      alert(error.message)
      return
    }

    setRecords(
      (currentRecords) =>
        currentRecords.map(
          (record) =>
            record.archive_id ===
            editingRecord.archive_id
              ? {
                  ...record,
                  ...updatedValues,
                }
              : record,
        ),
    )

    setSelectedRecord(
      (current) =>
        current &&
        current.archive_id ===
          editingRecord.archive_id
          ? {
              ...current,
              ...updatedValues,
            }
          : current,
    )

    setEditingRecord(null)
  }

  /*
   * --------------------------------------------------------------------------
   * Archive record
   * --------------------------------------------------------------------------
   */

  async function handleArchiveRecord() {
    if (!archivingRecord) {
      return
    }

    setArchiving(true)

    const { error } =
      await supabase.rpc(
        'archive_record',
        {
          p_archive_id:
            archivingRecord.archive_id,
        },
      )

    if (error) {
      console.error(
        'Archive failed:',
        error,
      )
      alert(error.message)
      setArchiving(false)
      return
    }

    setRecords(
      (currentRecords) =>
        currentRecords.filter(
          (record) =>
            record.archive_id !==
            archivingRecord.archive_id,
        ),
    )

    setArchivingRecord(null)
    setSelectedRecord(null)
    setArchiving(false)
  }

  /*
   * --------------------------------------------------------------------------
   * Loading / authorization states
   * --------------------------------------------------------------------------
   */

  if (roleLoading || loading) {
    return (
      <main className="archive-page">
        <div className="archive-loading">
          Loading archive...
        </div>
      </main>
    )
  }

  if (!role) {
    return (
      <main className="archive-page">
        <div className="archive-loading">
          You do not have access to the
          PHX Archive.
        </div>
      </main>
    )
  }

  /*
   * --------------------------------------------------------------------------
   * Main UI
   * --------------------------------------------------------------------------
   */

  return (
    <main className="archive-page">
      <div className="archive-shell">

        {/* ---------------------------------------------------------------- */}
        {/* Header */}
        {/* ---------------------------------------------------------------- */}

        <header className="archive-header">
          <div>
            <p className="archive-eyebrow">
              PHX / Internal Archive
            </p>

            <h1>
              PHX Archive
            </h1>

            <p className="archive-description">
              Search and access archived projects,
              locations, crews and storage
              references.
            </p>
          </div>

          <div className="archive-header-meta">
            <span>
              {role}
            </span>

            {isAdmin && (
              <button
                type="button"
                className="archive-add-button"
                onClick={() =>
                  setShowNewRecord(true)
                }
              >
                + Add New Shoot
              </button>
            )}

            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut()
              }}
              className="archive-signout"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* ---------------------------------------------------------------- */}
        {/* Search */}
        {/* ---------------------------------------------------------------- */}

        <section className="archive-search-section">
          <label
            htmlFor="archive-search"
            className="archive-search-label"
          >
            Search archive
          </label>

          <input
            id="archive-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search client, project, category, crew, HDD, city..."
            className="archive-search-input"
          />
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Filters */}
        {/* ---------------------------------------------------------------- */}

        <section className="archive-filters">
          <div className="archive-filter-header">
            <div>
              <p className="archive-filter-eyebrow">
                Refine
              </p>

              <h2>
                Filters
              </h2>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="archive-clear-filters"
            >
              Clear filters
            </button>
          </div>

          <div className="archive-filter-grid">

            <label>
              Year

              <select
                value={yearFilter}
                onChange={(event) =>
                  setYearFilter(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  All years
                </option>

                {years.map((year) => (
                  <option
                    key={year}
                    value={year}
                  >
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Division

              <select
                value={divisionFilter}
                onChange={(event) =>
                  setDivisionFilter(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  All divisions
                </option>

                {divisions.map(
                  (division) => (
                    <option
                      key={division}
                      value={division}
                    >
                      {division}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              Category

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  All categories
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              Main Crew

              <select
                value={mainCrewFilter}
                onChange={(event) =>
                  setMainCrewFilter(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  All main crew
                </option>

                {mainCrewOptions.map(
                  (crew) => (
                    <option
                      key={crew}
                      value={crew}
                    >
                      {crew}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              Assistant Crew

              <select
                value={assistantCrewFilter}
                onChange={(event) =>
                  setAssistantCrewFilter(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  All assistant crew
                </option>

                {assistantCrewOptions.map(
                  (crew) => (
                    <option
                      key={crew}
                      value={crew}
                    >
                      {crew}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              Sub-category

              <select
                value={subCategoryFilter}
                onChange={(event) =>
                  setSubCategoryFilter(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  All sub-categories
                </option>

                {subCategories.map(
                  (subCategory) => (
                    <option
                      key={subCategory}
                      value={subCategory}
                    >
                      {subCategory}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              City

              <select
                value={cityFilter}
                onChange={(event) =>
                  setCityFilter(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  All cities
                </option>

                {cities.map((city) => (
                  <option
                    key={city}
                    value={city}
                  >
                    {city}
                  </option>
                ))}
              </select>
            </label>

            <label>
              State

              <select
                value={stateFilter}
                onChange={(event) =>
                  setStateFilter(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  All states
                </option>

                {states.map((state) => (
                  <option
                    key={state}
                    value={state}
                  >
                    {state}
                  </option>
                ))}
              </select>
            </label>

            <label>
              HDD Alpha

              <select
                value={hddAlphaFilter}
                onChange={(event) =>
                  setHddAlphaFilter(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  All HDD Alpha
                </option>

                {hddAlphas.map((hdd) => (
                  <option
                    key={hdd}
                    value={hdd}
                  >
                    {hdd}
                  </option>
                ))}
              </select>
            </label>

            <label>
              HDD Beta

              <select
                value={hddBetaFilter}
                onChange={(event) =>
                  setHddBetaFilter(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  All HDD Beta
                </option>

                {hddBetas.map((hdd) => (
                  <option
                    key={hdd}
                    value={hdd}
                  >
                    {hdd}
                  </option>
                ))}
              </select>
            </label>

          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Results summary */}
        {/* ---------------------------------------------------------------- */}

        <div className="archive-results-header">
          <div>
            <span className="archive-results-count">
              {filteredRecords.length.toLocaleString()}
            </span>

            <span className="archive-results-label">
              records
            </span>
          </div>

          <div className="archive-page-count">
            Page {page} of {totalPages}
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Table */}
        {/* ---------------------------------------------------------------- */}

        <section className="archive-table-section">
          {error ? (
            <div className="archive-error">
              {error}
            </div>
          ) : paginatedRecords.length === 0 ? (
            <div className="archive-empty">
              No records found.
            </div>
          ) : (
            <div className="archive-table-wrapper">
              <table className="archive-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Project</th>
                    <th>Year</th>
                    <th>Division</th>
                    <th>Category</th>
                    <th>Sub-category</th>
                    <th>City</th>
                    <th>State</th>
                    <th>HDD Alpha</th>
                    <th>HDD Beta</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRecords.map(
                    (record) => (
                      <tr
                        key={record.archive_id}
                        onClick={() =>
                          setSelectedRecord(record)
                        }
                        className="archive-table-row"
                      >
                        <td>
                          {record.clients
                            ?.client_name ??
                            '—'}
                        </td>

                        <td>
                          {record.project}
                        </td>

                        <td>
                          {record.year}
                        </td>

                        <td>
                          {record.division}
                        </td>

                        <td>
                          {record.category}
                        </td>

                        <td>
                          {[
                            record.sub_category_1,
                            record.sub_category_2,
                            record.sub_category_3,
                          ]
                            .filter(Boolean)
                            .join(' · ') ||
                            '—'}
                        </td>

                        <td>
                          {record.city || '—'}
                        </td>

                        <td>
                          {record.state || '—'}
                        </td>

                        <td>
                          {record.hdd_alpha}
                        </td>

                        <td>
                          {record.hdd_beta}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Pagination */}
        {/* ---------------------------------------------------------------- */}

        {filteredRecords.length > 0 && (
          <div className="archive-pagination">
            <button
              type="button"
              disabled={page === 1}
              onClick={() =>
                setPage((current) =>
                  Math.max(
                    1,
                    current - 1,
                  ),
                )
              }
            >
              Previous
            </button>

            <span>
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={
                page === totalPages
              }
              onClick={() =>
                setPage((current) =>
                  Math.min(
                    totalPages,
                    current + 1,
                  ),
                )
              }
            >
              Next
            </button>
          </div>
        )}

        {showNewRecord && isAdmin && (
          <NewArchiveRecord
            onClose={() =>
              setShowNewRecord(false)
            }
            onCreated={async () => {
              setShowNewRecord(false)
              await loadRecords()
            }}
            categoryOptions={categories}
            hddAlphaOptions={hddAlphas}
            hddBetaOptions={hddBetas}
            subCategory1Options={
              subCategory1Options
            }
            subCategory2Options={
              subCategory2Options
            }
            subCategory3Options={
              subCategory3Options
            }
            crewOptions={crewOptions}
            cityOptions={cities}
            stateOptions={states}
          />
        )}

      </div>

      {/* ================================================================== */}
      {/* RECORD DETAIL OVERLAY */}
      {/* ================================================================== */}

      {selectedRecord && (
        <div
          className="archive-detail-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedRecord(null)
            }
          }}
        >
          <aside className="archive-detail-panel">

            {/* ------------------------------------------------------------ */}
            {/* Detail header */}
            {/* ------------------------------------------------------------ */}

            <div className="archive-detail-header">
              <div>
                <p className="archive-detail-eyebrow">
                  Archive Record
                </p>

                <h2>
                  {selectedRecord.project}
                </h2>
              </div>

              <div className="archive-detail-actions">
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      className="archive-edit-button"
                      onClick={() =>
                        setEditingRecord(
                          selectedRecord,
                        )
                      }
                    >
                      Edit Record
                    </button>

                    <button
                      type="button"
                      className="archive-archive-button"
                      onClick={() =>
                        setArchivingRecord(
                          selectedRecord,
                        )
                      }
                    >
                      Archive Record
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="archive-detail-close"
                  onClick={() =>
                    setSelectedRecord(null)
                  }
                  aria-label="Close record"
                >
                  ×
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Detail content */}
            {/* ------------------------------------------------------------ */}

            <div className="archive-detail-content">

              <section className="archive-detail-section">
                <p className="archive-detail-section-label">
                  Project
                </p>

                <div className="archive-detail-grid">

                  <div>
                    <span>Client</span>

                    <strong>
                      {selectedRecord.clients
                        ?.client_name ??
                        '—'}
                    </strong>
                  </div>

                  <div>
                    <span>Project</span>

                    <strong>
                      {selectedRecord.project}
                    </strong>
                  </div>

                  <div>
                    <span>Year</span>

                    <strong>
                      {selectedRecord.year}
                    </strong>
                  </div>

                  <div>
                    <span>Division</span>

                    <strong>
                      {selectedRecord.division}
                    </strong>
                  </div>

                </div>
              </section>

              <section className="archive-detail-section">
                <p className="archive-detail-section-label">
                  Classification
                </p>

                <div className="archive-detail-grid">

                  <div>
                    <span>Category</span>

                    <strong>
                      {selectedRecord.category}
                    </strong>
                  </div>

                  <div>
                    <span>Sub-category 1</span>

                    <strong>
                      {selectedRecord.sub_category_1 ||
                        '—'}
                    </strong>
                  </div>

                  <div>
                    <span>Sub-category 2</span>

                    <strong>
                      {selectedRecord.sub_category_2 ||
                        '—'}
                    </strong>
                  </div>

                  <div>
                    <span>Sub-category 3</span>

                    <strong>
                      {selectedRecord.sub_category_3 ||
                        '—'}
                    </strong>
                  </div>

                </div>
              </section>

              <section className="archive-detail-section">
                <p className="archive-detail-section-label">
                  Storage
                </p>

                <div className="archive-detail-grid">

                  <div>
                    <span>HDD Alpha</span>

                    <strong>
                      {selectedRecord.hdd_alpha}
                    </strong>
                  </div>

                  <div>
                    <span>HDD Beta</span>

                    <strong>
                      {selectedRecord.hdd_beta}
                    </strong>
                  </div>

                </div>
              </section>

              <section className="archive-detail-section">
                <p className="archive-detail-section-label">
                  Crew
                </p>

                <div className="archive-detail-grid">

                  <div>
                    <span>Lead Crew</span>

                    <strong>
                      {selectedRecord.lead_crew ||
                        '—'}
                    </strong>
                  </div>

                  <div>
                    <span>Assistant 1</span>

                    <strong>
                      {selectedRecord.asst_1 ||
                        '—'}
                    </strong>
                  </div>

                  <div>
                    <span>Assistant 2</span>

                    <strong>
                      {selectedRecord.asst_2 ||
                        '—'}
                    </strong>
                  </div>

                  <div>
                    <span>Assistant 3</span>

                    <strong>
                      {selectedRecord.asst_3 ||
                        '—'}
                    </strong>
                  </div>

                </div>
              </section>

              <section className="archive-detail-section">
                <p className="archive-detail-section-label">
                  Location
                </p>

                <div className="archive-detail-grid">

                  <div>
                    <span>City</span>

                    <strong>
                      {selectedRecord.city ||
                        '—'}
                    </strong>
                  </div>

                  <div>
                    <span>State</span>

                    <strong>
                      {selectedRecord.state ||
                        '—'}
                    </strong>
                  </div>

                </div>
              </section>

            </div>

            {/* ------------------------------------------------------------ */}
            {/* Detail footer */}
            {/* ------------------------------------------------------------ */}

            <div className="archive-detail-footer">
              <span>
                Record ID
              </span>

              <code>
                {selectedRecord.archive_id}
              </code>
            </div>

          </aside>

          {/* ================================================================ */}
          {/* EDIT OVERLAY */}
          {/* ================================================================ */}

          {editingRecord && (
            <div
              className="archive-edit-overlay"
              onMouseDown={(event) => {
                if (
                  event.target ===
                  event.currentTarget
                ) {
                  setEditingRecord(null)
                }
              }}
            >
              <aside className="archive-edit-panel">

                {/* ---------------------------------------------------------- */}
                {/* Edit header */}
                {/* ---------------------------------------------------------- */}

                <div className="archive-detail-header">
                  <div>
                    <p className="archive-detail-eyebrow">
                      Edit Record
                    </p>

                    <h2>
                      {editingRecord.project}
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="archive-detail-close"
                    onClick={() =>
                      setEditingRecord(null)
                    }
                    aria-label="Close edit form"
                  >
                    ×
                  </button>
                </div>

                {/* ---------------------------------------------------------- */}
                {/* Edit form */}
                {/* ---------------------------------------------------------- */}

                <form
                  onSubmit={handleUpdateRecord}
                  className="archive-edit-form"
                >
                  <div className="archive-edit-content">

                    <label>
                      HDD Alpha

                      <input
                        name="hdd_alpha"
                        type="text"
                        defaultValue={
                          editingRecord.hdd_alpha
                        }
                        required
                      />
                    </label>

                    <label>
                      HDD Beta

                      <input
                        name="hdd_beta"
                        type="text"
                        defaultValue={
                          editingRecord.hdd_beta
                        }
                        required
                      />
                    </label>

                    <label>
                      Project

                      <input
                        name="project"
                        type="text"
                        defaultValue={
                          editingRecord.project
                        }
                        required
                      />
                    </label>

                    <label>
                      Year

                      <input
                        name="year"
                        type="number"
                        defaultValue={
                          editingRecord.year
                        }
                        required
                      />
                    </label>

                    <label>
                      Division

                      <select
                        name="division"
                        defaultValue={
                          editingRecord.division
                        }
                        required
                      >
                        {divisions.map(
                          (division) => (
                            <option
                              key={division}
                              value={division}
                            >
                              {division}
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <label>
                      Category

                      <select
                        name="category"
                        defaultValue={
                          editingRecord.category
                        }
                        required
                      >
                        {categories.map(
                          (category) => (
                            <option
                              key={category}
                              value={category}
                            >
                              {category}
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <label>
                      Sub-category 1

                      <select
                        name="sub_category_1"
                        defaultValue={
                          editingRecord.sub_category_1 ??
                          ''
                        }
                      >
                        <option value="">
                          None
                        </option>

                        {subCategory1Options.map(
                          (subCategory) => (
                            <option
                              key={subCategory}
                              value={subCategory}
                            >
                              {subCategory}
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <label>
                      Sub-category 2

                      <select
                        name="sub_category_2"
                        defaultValue={
                          editingRecord.sub_category_2 ??
                          ''
                        }
                      >
                        <option value="">
                          None
                        </option>

                        {subCategory2Options.map(
                          (subCategory) => (
                            <option
                              key={subCategory}
                              value={subCategory}
                            >
                              {subCategory}
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <label>
                      Sub-category 3

                      <select
                        name="sub_category_3"
                        defaultValue={
                          editingRecord.sub_category_3 ??
                          ''
                        }
                      >
                        <option value="">
                          None
                        </option>

                        {subCategory3Options.map(
                          (subCategory) => (
                            <option
                              key={subCategory}
                              value={subCategory}
                            >
                              {subCategory}
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <label>
                      Lead Crew

                      <input
                        name="lead_crew"
                        type="text"
                        defaultValue={
                          editingRecord.lead_crew ??
                          ''
                        }
                      />
                    </label>

                    <label>
                      Assistant 1

                      <input
                        name="asst_1"
                        type="text"
                        defaultValue={
                          editingRecord.asst_1 ??
                          ''
                        }
                      />
                    </label>

                    <label>
                      Assistant 2

                      <input
                        name="asst_2"
                        type="text"
                        defaultValue={
                          editingRecord.asst_2 ??
                          ''
                        }
                      />
                    </label>

                    <label>
                      Assistant 3

                      <input
                        name="asst_3"
                        type="text"
                        defaultValue={
                          editingRecord.asst_3 ??
                          ''
                        }
                      />
                    </label>

                    <label>
                      City

                      <input
                        name="city"
                        type="text"
                        defaultValue={
                          editingRecord.city ??
                          ''
                        }
                      />
                    </label>

                    <label>
                      State

                      <input
                        name="state"
                        type="text"
                        defaultValue={
                          editingRecord.state ??
                          ''
                        }
                      />
                    </label>

                  </div>

                  {/* -------------------------------------------------------- */}
                  {/* Edit footer */}
                  {/* -------------------------------------------------------- */}

                  <div className="archive-edit-footer">
                    <button
                      type="button"
                      className="archive-edit-cancel"
                      onClick={() =>
                        setEditingRecord(null)
                      }
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="archive-edit-save"
                    >
                      Save changes
                    </button>
                  </div>

                </form>

              </aside>
            </div>
          )}

          {/* ================================================================ */}
          {/* ARCHIVE CONFIRMATION OVERLAY */}
          {/* ================================================================ */}

          {archivingRecord && (
            <div
              className="archive-confirm-overlay"
              onMouseDown={(event) => {
                if (
                  event.target ===
                    event.currentTarget &&
                  !archiving
                ) {
                  setArchivingRecord(null)
                }
              }}
            >
              <div className="archive-confirm-panel">

                <p className="archive-detail-eyebrow">
                  Archive Record
                </p>

                <h2>
                  Are you sure?
                </h2>

                <p className="archive-confirm-description">
                  This will remove this record from
                  the active archive. An
                  administrator can restore it
                  later.
                </p>

                <div className="archive-confirm-record">
                  <strong>
                    {archivingRecord.project}
                  </strong>

                  <span>
                    {archivingRecord.division}
                    {' · '}
                    {archivingRecord.year}
                    {' · '}
                    {archivingRecord.category}
                  </span>
                </div>

                <div className="archive-confirm-actions">

                  <button
                    type="button"
                    className="archive-confirm-cancel"
                    disabled={archiving}
                    onClick={() =>
                      setArchivingRecord(null)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="archive-confirm-submit"
                    disabled={archiving}
                    onClick={
                      handleArchiveRecord
                    }
                  >
                    {archiving
                      ? 'Archiving...'
                      : 'Archive record'}
                  </button>

                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </main>
  )
}

export default Archive