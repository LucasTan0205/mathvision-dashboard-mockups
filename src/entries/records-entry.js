import { mountPage } from '/src/app.js';
import { createRecordsContent, initRecords } from '/src/pages/records-page.js';

mountPage({
  route: '/records.html',
  title: 'Records',
  breadcrumb: 'Records',
  contentHtml: createRecordsContent(),
  init: initRecords
});
