import { mountPage } from '/src/app.js';
import { createCsvUploadContent, init } from '/src/pages/csv-upload-page.js';

mountPage({
  route: '/csv-upload.html',
  title: 'CSV Upload',
  breadcrumb: 'CSV Upload',
  contentHtml: createCsvUploadContent(),
  init
});
