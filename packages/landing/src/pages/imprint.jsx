import Layout from '@/components/Layout/Layout';
import { Box, Title } from '@mantine/core';

const Imprint = () => {
  return (
    <Layout title="Imprint" description="Legal information and contact details for StatusScout.">
      <Box maw={800} mx="auto" px="md" py="xl">
        <Title order={1} mb="xl">Imprint</Title>

        <Title order={2} my="md">Information pursuant to § 5 TMG:</Title>
        <p>
          Vincent Will<br />
          Landsberger Allee 171D<br />
          10369 Berlin<br />
          <b>Contact:</b><br />
          Email: hello@statusscout.dev<br />
        </p><br />

        {/* VAT ID
            Value-added tax identification number pursuant to § 27 a VAT Act:
            DE XXX XXX XXX */}

        <Title order={2} my="md">Liability for Contents</Title>

        <p>
          All content on our website has been created with the utmost care and to the best of our knowledge. However, we cannot guarantee the accuracy, completeness, or timeliness of the content. As a service provider, we are responsible for our own content on these pages in accordance with general laws pursuant to § 7 para. 1 TMG. According to §§ 8 to 10 TMG, we are not obliged to monitor transmitted or stored external information or to investigate circumstances indicating illegal activity. Obligations to remove or block the use of information under general laws remain unaffected.<br />
          Liability in this regard is only possible from the time we become aware of a specific legal infringement. Upon becoming aware of such legal violations, we will remove the content immediately.
        </p>

        <Title order={2} my="md">Limitation of Liability for External Links</Title>

        <p>
          Our website contains links to external third-party websites. We have no influence on the content of these directly or indirectly linked websites. Therefore, we cannot assume any liability for the accuracy of the content of these “external links.” The respective provider or operator (author) of the linked pages is responsible for the content of these external links.
        </p>
        <p>
          At the time the links were set, no legal violations were apparent. A continuous monitoring of the content of the external links is not reasonable without concrete evidence of a legal infringement. In the case of direct or indirect links to third-party websites outside our area of responsibility, liability would only arise if we had knowledge of the content and it was technically possible and reasonable for us to prevent the use in the case of illegal content.
        </p>
        <p>
          This disclaimer also applies to links and references within our own website “statusscout.dev” set by users, blog posters, and guests of the discussion forum. For illegal, incorrect, or incomplete content and especially for damages resulting from the use or non-use of such information, only the service provider of the page referred to is liable, not the one who merely refers to the respective publication via links.
        </p>
        <p>
          If we become aware of any legal violations, we will remove the external links immediately.
        </p>

        <Title order={2} my="md">Copyright</Title>

        <p>
          The content and works published on our website are subject to German copyright law (http://www.gesetze-im-internet.de/bundesrecht/urhg/gesamt.pdf). Reproduction, processing, distribution, and any kind of exploitation of intellectual property in both material and non-material ways beyond the limits of copyright law require the prior written consent of the respective author as defined in the Copyright Act (http://www.gesetze-im-internet.de/bundesrecht/urhg/gesamt.pdf). Downloads and copies of this site are only permitted for private, non-commercial use. Where content on our website was not created by us, the copyrights of third parties are respected. Third-party content is marked as such. Should you still become aware of a copyright infringement, please inform us accordingly. Upon becoming aware of legal violations, we will remove such content immediately.
        </p>

        <br />
        <p>This imprint was kindly provided by jurarat.de.</p>
      </Box>
    </Layout>
  );
};

export default Imprint;
