import { notFound } from 'next/navigation';
import { formsDbServer } from '@/lib/database';
import PublicFormServerWrapper from '../../forms/[id]/components/PublicFormServerWrapper';

interface PublicFormPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const form = await formsDbServer.getPublicForm(slug);
    if (!form) return {};
    const title = form.schema?.settings?.title || form.title || 'Form';
    const description =
      form.schema?.settings?.description ||
      form.description ||
      'Fill out this form.';
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://www.ikiform.com/f/${slug}`,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  } catch {
    return {};
  }
}

export default async function PublicFormPage({
  params,
  searchParams,
}: PublicFormPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const theme =
    typeof resolvedSearchParams.theme === 'string'
      ? resolvedSearchParams.theme
      : 'light';

  try {
    const form = await formsDbServer.getPublicForm(slug);

    if (!form) {
      console.log(`Form not found for slug: ${slug}`);
      notFound();
    }

    console.log('Form fetched successfully:', {
      id: form.id,
      title: form.schema?.settings?.title,
      fieldsCount: form.schema?.fields?.length || 0,
      blocksCount: form.schema?.blocks?.length || 0,
      isPublished: form.is_published,
    });

    return (
      <PublicFormServerWrapper
        formId={form.id}
        schema={form.schema}
        theme={theme}
      />
    );
  } catch (error) {
    console.error('Error fetching form:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    notFound();
  }
}
