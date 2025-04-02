;; Device Registration Contract
;; Records details of hospital equipment

(define-data-var last-device-id uint u0)

(define-map devices
  uint
  {
    name: (string-ascii 100),
    model: (string-ascii 100),
    serial-number: (string-ascii 100),
    manufacturer: (string-ascii 100),
    purchase-date: uint,
    warranty-expiry: uint,
    department: (string-ascii 100),
    status: (string-ascii 20)
  }
)

(define-map device-owners
  uint
  principal
)

(define-read-only (get-device (device-id uint))
  (map-get? devices device-id)
)

(define-read-only (get-device-owner (device-id uint))
  (map-get? device-owners device-id)
)

(define-read-only (get-last-device-id)
  (var-get last-device-id)
)

(define-public (register-device
    (name (string-ascii 100))
    (model (string-ascii 100))
    (serial-number (string-ascii 100))
    (manufacturer (string-ascii 100))
    (purchase-date uint)
    (warranty-expiry uint)
    (department (string-ascii 100))
  )
  (let
    (
      (new-id (+ (var-get last-device-id) u1))
    )
    (var-set last-device-id new-id)
    (map-set devices
      new-id
      {
        name: name,
        model: model,
        serial-number: serial-number,
        manufacturer: manufacturer,
        purchase-date: purchase-date,
        warranty-expiry: warranty-expiry,
        department: department,
        status: "active"
      }
    )
    (map-set device-owners
      new-id
      tx-sender
    )
    (ok new-id)
  )
)

(define-public (update-device-status (device-id uint) (new-status (string-ascii 20)))
  (let
    (
      (device (unwrap! (get-device device-id) (err u404)))
      (owner (unwrap! (get-device-owner device-id) (err u404)))
    )
    ;; Check if the caller is the owner
    (asserts! (is-eq tx-sender owner) (err u403))
    (map-set devices
      device-id
      (merge device { status: new-status })
    )
    (ok true)
  )
)

(define-public (transfer-device (device-id uint) (new-owner principal))
  (let
    (
      (owner (unwrap! (get-device-owner device-id) (err u404)))
    )
    ;; Check if the caller is the owner
    (asserts! (is-eq tx-sender owner) (err u403))
    (map-set device-owners
      device-id
      new-owner
    )
    (ok true)
  )
)

