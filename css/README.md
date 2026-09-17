# Innera Clinical CSS split

This folder was split from the uploaded `style(9).css`.

## Files
- `dashboard.css` — variables, global styles, dashboard/patient list and its original RWD
- `sidebar.css` — responsive sidebar fixes; keep navigation text and logout visible
- `components.css` — drawer, modal, toast and shared interactive components
- `login.css` — shared helpers and login page
- `patient-detail.css` — patient detail page + tablet overlap fix
- `clinic-management.css` — clinic management/settings
- `style-original.css` — untouched backup

## Recommended `<link>` order

Dashboard:
```html
<link rel="stylesheet" href="css/dashboard.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/sidebar.css">
```

Patient detail:
```html
<link rel="stylesheet" href="css/dashboard.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/patient-detail.css">
<link rel="stylesheet" href="css/sidebar.css">
```

Clinic management:
```html
<link rel="stylesheet" href="css/dashboard.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/clinic-management.css">
<link rel="stylesheet" href="css/sidebar.css">
```

Login:
```html
<link rel="stylesheet" href="css/dashboard.css">
<link rel="stylesheet" href="css/login.css">
```

`sidebar.css` should be loaded last on authenticated pages because it intentionally overrides the old <=900px icon-only sidebar rules that still exist in `dashboard.css` / merged page CSS.
