;; Repair Tracking Contract
;; Documents issues and resolution actions

(define-data-var last-repair-id uint u0)

(define-map repairs
  uint
  {
    device-id: uint,
    reported-by: principal,
    issue-description: (string-ascii 500),
    reported-date: uint,
    status: (string-ascii 20),
    priority: (string-ascii 20)
  }
)

(define-map repair-actions
  { repair-id: uint, action-timestamp: uint }
  {
    performed-by: principal,
    action-description: (string-ascii 500),
    parts-replaced: (string-ascii 500),
    cost: uint
  }
)

(define-read-only (get-repair (repair-id uint))
  (map-get? repairs repair-id)
)

(define-read-only (get-repair-action (repair-id uint) (action-timestamp uint))
  (map-get? repair-actions { repair-id: repair-id, action-timestamp: action-timestamp })
)

(define-read-only (get-last-repair-id)
  (var-get last-repair-id)
)

(define-public (report-issue
    (device-id uint)
    (issue-description (string-ascii 500))
    (priority (string-ascii 20))
  )
  (let
    (
      (new-id (+ (var-get last-repair-id) u1))
    )
    (var-set last-repair-id new-id)
    (map-set repairs
      new-id
      {
        device-id: device-id,
        reported-by: tx-sender,
        issue-description: issue-description,
        reported-date: block-height,
        status: "reported",
        priority: priority
      }
    )
    (ok new-id)
  )
)

(define-public (update-repair-status (repair-id uint) (new-status (string-ascii 20)))
  (let
    (
      (repair (unwrap! (get-repair repair-id) (err u404)))
    )
    ;; Simplified version without contract calls for now
    (map-set repairs
      repair-id
      (merge repair { status: new-status })
    )
    (ok true)
  )
)

(define-public (add-repair-action
    (repair-id uint)
    (action-description (string-ascii 500))
    (parts-replaced (string-ascii 500))
    (cost uint)
  )
  (let
    (
      (repair (unwrap! (get-repair repair-id) (err u404)))
      (current-time block-height)
    )
    (map-set repair-actions
      { repair-id: repair-id, action-timestamp: current-time }
      {
        performed-by: tx-sender,
        action-description: action-description,
        parts-replaced: parts-replaced,
        cost: cost
      }
    )
    (ok true)
  )
)

