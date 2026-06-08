Enum warehouse_location_type {
pick
bulk
productie
schroot
laad
inspectie
inruim
uitsorteer
bewerker
afhaal
afroep
}

Enum warehouse_location_adopt_position {
next
below
}

Table warehouse_locations {
id int [pk, increment]

// Main info
name varchar(255) [not null]
location_type warehouse_location_type [not null]
picking_sequence int [default: 0]

// Blocking
is_blocked boolean [default: false]
blocked_reason varchar(255)

blocked_for_optimization boolean [default: false]
limited_dimensions boolean [default: false]

// Adopt from
adopt_from_warehouse varchar(255)
// TODO: Later this should come from warehouse table.
// Example later:
// adopt_from_warehouse_id int [ref: > warehouses.id]

adopt_position warehouse_location_adopt_position [default: 'below']

is_active boolean [default: true]

notes text

created_at timestamp
updated_at timestamp
}

Enum warehouse_product_type {
beam
tube
sheet
profile
bar
}

Table warehouse_location_dimension_settings {
id int [pk, increment]

// Related location
warehouse_location_id int [ref: > warehouse_locations.id]

// Dimensions
minimum_length_mm decimal(18, 3) [default: 0]
maximum_length_mm decimal(18, 3) [default: 0]
maximum_width_mm decimal(18, 3) [default: 0]
maximum_weight_kg decimal(18, 3) [default: 0]

is_active boolean [default: true]

notes text

created_at timestamp
updated_at timestamp
}

Table warehouse_location_allowed_product_types {
id int [pk, increment]

warehouse_location_dimension_setting_id int [ref: > warehouse_location_dimension_settings.id]

product_type warehouse_product_type [not null]

created_at timestamp
updated_at timestamp
}

Enum warehouse_count_as_type {
technical_stock
available_stock
}

Table warehouse_location_count_settings {
id int [pk, increment]

// Related location
warehouse_location_id int [ref: > warehouse_locations.id]

// Count settings
count_frequency int [default: 0] // Count 0 per
counted_this int [default: 0]

target_date date
last_count_date date

// Count as
count_as warehouse_count_as_type [default: 'technical_stock']

// Under quantity condition
under_quantity decimal(18, 3) [default: 0]
under_uom_id int [ref: > unit_of_measures.id]

// Open count order option
open_count_order_available boolean [default: false]

// Count now is an action/button, not a normal input.
// Store this only if you want to track when the button was clicked.
last_count_requested_at timestamp

is_active boolean [default: true]

notes text

created_at timestamp
updated_at timestamp
}

/_ =========================
CUSTOMER GROUPS
========================= _/

Table customer_groups {
id int [pk, increment]

code varchar(100) [not null, unique]
name varchar(255) [not null]
description text

is_active boolean [default: true]

created_at timestamp
updated_at timestamp
}

/_ =========================
REGIONS
========================= _/

Table regions {
id int [pk, increment]

code varchar(100) [not null, unique]
name varchar(255) [not null]
description text

is_active boolean [default: true]

created_at timestamp
updated_at timestamp
}

/_ =========================
INDUSTRIES
========================= _/

Table industries {
id int [pk, increment]

industry_code varchar(100) [not null, unique]
name varchar(255) [not null]
description text

is_active boolean [default: true]

created_at timestamp
updated_at timestamp
}

/_ =========================
CLASSIFICATIONS
========================= _/

Table classifications {
id int [pk, increment]

classification_code varchar(100) [not null, unique]
name varchar(255) [not null]
description text

is_active boolean [default: true]

created_at timestamp
updated_at timestamp
}

/_ =========================
SALES REPRESENTATIVES
========================= _/

Table sales_representatives {
id int [pk, increment]

code varchar(100)
name varchar(255) [not null]
email varchar(255)
phone varchar(100)

is_active boolean [default: true]

created_at timestamp
updated_at timestamp
}

/_ =========================
CONTACT SALUTATIONS
========================= _/

Table contact_salutations {
id int [pk, increment]

name varchar(50) [not null] // Mr, Mrs, Ms, Dr
description text

is_active boolean [default: true]

created_at timestamp
updated_at timestamp
}

/_ =========================
CONTACT CATEGORIES
========================= _/

Table contact_categories {
id int [pk, increment]

name varchar(255) [not null]
description text

is_active boolean [default: true]

created_at timestamp
updated_at timestamp
}

/_ =========================
CONTACTS
========================= _/

Table contacts {
id int [pk, increment]

// Main contact info
salutation_id int [ref: > contact_salutations.id]

title varchar(100)
name varchar(255)
initials varchar(50)
first_name varchar(255)
last_name varchar(255)
full_name varchar(255) [not null]

telephone varchar(100)
mobile varchar(100)
fax varchar(100)
email varchar(255)

btw_number varchar(100) // VAT / BTW number
category_addition text

// Address relation
address_id int [ref: > addresses.id]

// Address snapshot / direct contact address fields
location_id int [ref: > locations.id]
country_id int [ref: > countries.id]
city_id int [ref: > cities.id]

postal_code varchar(100)
region varchar(255)

street_and_number varchar(255)
house varchar(100)
po_box varchar(100)
annex varchar(255)
alternative_name varchar(255)

website varchar(255)
sequence_number int

is_active boolean [default: true]

notes text

created_at timestamp
updated_at timestamp
}

/_ =========================
CONTACT CATEGORY LINKS
========================= _/

Table contact_category_links {
id int [pk, increment]

contact_id int [ref: > contacts.id]
contact_category_id int [ref: > contact_categories.id]

created_at timestamp
updated_at timestamp
}
