import Layout from '../../components/Layout';
import Link from 'next/link';
import Head from 'next/head';
import { supabase } from '../../lib/supabaseClient';

// Aynı slug oluşturma fonksiyonu
const createSlug = (text) => {
  return (text || 'arastirma-notu')
    .toString()
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export default function ViaPlotinPost({ post, error }) {
  if (error || !post) {
    return (
      <Layout>
        <section className="section">
          <div className="container">
            <p className="status err">
              Yazı bulunamadı.
            </p>

            <Link
              href="/via-plotin"
              style={{
                color: 'var(--gold-bright)',
                textDecoration: 'none',
              }}
            >
              ← Via Plotin'e dön
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>
          {post.baslik || 'Araştırma Notu'} · Via Plotin
        </title>

        <meta
          name="description"
          content={
            post.ozet ||
            post.baslik ||
            'Plotinos ve Neoplatonizm üzerine araştırma notu.'
          }
        />
      </Head>

      <section
        className="hero"
        style={{
          paddingBottom: 40,
        }}
      >
        <div className="eyebrow">
          Via Plotin
        </div>

        {post.kategori && (
          <div
            style={{
              marginBottom: '12px',
            }}
          >
            <span className="tag">
              {post.kategori}
            </span>
          </div>
        )}

        <h1
          style={{
            maxWidth: '850px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {post.baslik || 'Araştırma Notu'}
        </h1>

        {post.tarih && (
          <div
            className="meta"
            style={{
              marginTop: '14px',
            }}
          >
            {post.tarih}
          </div>
        )}
      </section>

      <section
        className="section"
        style={{
          borderTop: 'none',
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: '800px',
          }}
        >

          {/* GERİ DÖN */}

          <div
            style={{
              marginBottom: '32px',
            }}
          >
            <Link
              href="/via-plotin"
              style={{
                color:
                  'var(--gold-bright)',
                textDecoration:
                  'none',
                fontFamily:
                  'var(--font-mono)',
                fontSize:
                  '0.75rem',
              }}
            >
              ← Via Plotin'e dön
            </Link>
          </div>

          {/* ÖZET */}

          {post.ozet && (
            <div
              style={{
                borderLeft:
                  '2px solid var(--gold)',
                paddingLeft:
                  '18px',
                marginBottom:
                  '32px',
                color:
                  'var(--parchment-dim)',
                fontStyle:
                  'italic',
                lineHeight:
                  '1.7',
              }}
            >
              {post.ozet}
            </div>
          )}

          {/* YAZININ TAMAMI */}

          <article
            className="desc"
            style={{
              whiteSpace:
                'pre-line',
              fontSize:
                '1rem',
              lineHeight:
                '1.9',
            }}
          >
            {post.content}
          </article>

          {/* ALT GERİ DÖNÜŞ */}

          <div
            style={{
              marginTop: '48px',
              paddingTop: '24px',
              borderTop:
                '1px solid var(--line)',
            }}
          >
            <Link
              href="/via-plotin"
              style={{
                color:
                  'var(--gold-bright)',
                textDecoration:
                  'none',
                fontFamily:
                  'var(--font-mono)',
                fontSize:
                  '0.75rem',
              }}
            >
              ← Tüm Via Plotin yazılarına dön
            </Link>
          </div>

        </div>
      </section>
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const { slug } = context.params;

  /*
   * URL şu şekilde:
   *
   * plotinos-ve-kotuluk--17
   *
   * Son -- kısmından sonraki değer
   * Supabase'deki id'dir.
   */

  const separatorIndex = slug.lastIndexOf('--');

  if (separatorIndex === -1) {
    return {
      props: {
        post: null,
        error: 'Geçersiz yazı adresi.',
      },
    };
  }

  const id = slug.slice(
    separatorIndex + 2
  );

  const { data, error } = await supabase
    .from('via_plotin')
    .select('*')
    .eq('id', id)
    .single();

  return {
    props: {
      post: data || null,
      error: error
        ? error.message
        : null,
    },
  };
}