/**
 * Realistic Article Seed Data
 * Contains actual excerpts from DORA and GDPR
 */

export interface ArticleSeed {
  articleNumber: string
  sectionTitle: string
  title: string
  rawText: string
  normalizedText: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

// =============================================================================
// DORA Articles - Actual excerpts from (EU) 2022/2554
// =============================================================================

export const DORA_ARTICLES: ArticleSeed[] = [
  {
    articleNumber: 'Article 5',
    sectionTitle: 'Chapter II - ICT Risk Management',
    title: 'Governance and organisation',
    rawText: `Financial entities shall have in place an internal governance and control framework that ensures an effective and prudent management of ICT risk, in order to achieve a high level of digital operational resilience.

The management body of the financial entity shall define, approve, oversee and be responsible for the implementation of all arrangements related to the ICT risk management framework referred to in Article 6(1).

For the purpose of the first subparagraph, the management body shall:
(a) bear the ultimate responsibility for managing the financial entity's ICT risk;
(b) put in place policies that aim to ensure the maintenance of high standards of availability, authenticity, integrity and confidentiality, of data;
(c) set clear roles and responsibilities for all ICT-related functions and establish appropriate governance arrangements to ensure effective and timely communication, cooperation and coordination among those functions;
(d) bear the overall responsibility for setting and approving the digital operational resilience strategy as referred to in Article 6(8), including the determination of the appropriate risk tolerance level of ICT risk of the financial entity;
(e) approve, oversee and periodically review the implementation of the financial entity's ICT business continuity policy and ICT response and recovery plans;
(f) approve and periodically review the financial entity's ICT internal audit plans, ICT audits and material modifications to them;
(g) allocate and periodically review the appropriate budget to fulfil the financial entity's digital operational resilience needs in respect of all types of resources, including relevant ICT security awareness programmes and digital operational resilience training;
(h) approve and periodically review the financial entity's policy on arrangements regarding the use of ICT services supporting critical or important functions provided by ICT third-party service providers.`,
    normalizedText: `Financial entities must have internal governance ensuring effective ICT risk management for digital operational resilience. The management body defines, approves, and oversees ICT risk management implementation, bearing ultimate responsibility. They must establish policies for data availability, authenticity, integrity, and confidentiality; set clear ICT roles and responsibilities; approve digital resilience strategy and risk tolerance; oversee ICT business continuity and recovery plans; approve ICT audit plans; allocate budget for digital resilience needs; and approve policies for ICT third-party services.`,
    riskLevel: 'critical',
  },
  {
    articleNumber: 'Article 6',
    sectionTitle: 'Chapter II - ICT Risk Management',
    title: 'ICT risk management framework',
    rawText: `Financial entities shall have a sound, comprehensive and well-documented ICT risk management framework as part of their overall risk management system, which enables them to address ICT risk quickly, efficiently and comprehensively and to ensure a high level of digital operational resilience.

The ICT risk management framework shall include at least strategies, policies, procedures, ICT protocols and tools that are necessary to duly and adequately protect all information assets and ICT assets, including computer software, hardware, servers, as well as to protect all the relevant physical components and infrastructures, such as premises, data centres and sensitive designated areas, to ensure that all information assets and ICT assets are adequately protected from risks including damage and unauthorised access or usage.`,
    normalizedText: `Financial entities require a comprehensive, documented ICT risk management framework within their overall risk management system for quick and efficient ICT risk response. The framework must include strategies, policies, procedures, protocols, and tools to protect all information and ICT assets (software, hardware, servers) and physical infrastructure (premises, data centers) from damage and unauthorized access.`,
    riskLevel: 'critical',
  },
  {
    articleNumber: 'Article 11',
    sectionTitle: 'Chapter II - ICT Risk Management',
    title: 'ICT business continuity policy',
    rawText: `As part of the ICT risk management framework referred to in Article 6(1), financial entities shall put in place a dedicated and comprehensive ICT business continuity policy, which may be adopted as a dedicated specific policy, forming an integral part of the overall business continuity policy of the financial entity.

Financial entities shall implement the ICT business continuity policy through dedicated, appropriate and documented arrangements, plans, procedures and mechanisms aiming to:
(a) ensure the continuity of the financial entity's critical or important functions;
(b) quickly, appropriately and effectively respond to, and resolve, all ICT-related incidents in a way that limits damage and prioritises the resumption of activities and recovery actions;
(c) activate, without delay, dedicated plans that enable containment measures, processes and technologies suited to each type of ICT-related incident and prevent further damage, as well as tailored response and recovery procedures established in accordance with Article 12;
(d) estimate preliminary impacts, damages and losses;
(e) set out communication and crisis management actions that ensure that updated information is transmitted to all relevant internal staff and external stakeholders in accordance with Article 14, and reported to the competent authorities in accordance with Article 19.`,
    normalizedText: `Financial entities must establish a comprehensive ICT business continuity policy as part of their risk management framework. Implementation requires documented arrangements to ensure continuity of critical functions, enable quick incident response and damage limitation, activate containment plans for each incident type, estimate impacts and losses, and manage communications with staff, stakeholders, and authorities.`,
    riskLevel: 'critical',
  },
  {
    articleNumber: 'Article 17',
    sectionTitle: 'Chapter III - ICT-related Incident Management',
    title: 'ICT-related incident management process',
    rawText: `Financial entities shall define, establish and implement an ICT-related incident management process to detect, manage and notify ICT-related incidents.

Financial entities shall record all ICT-related incidents and significant cyber threats. Financial entities shall establish appropriate procedures and processes to ensure a consistent and integrated monitoring, handling and follow-up of ICT-related incidents, to ensure that root causes are identified, documented and addressed to prevent the occurrence of such incidents.

The ICT-related incident management process referred to in paragraph 1 shall:
(a) put in place early warning indicators;
(b) establish procedures to identify, track, log, categorise and classify ICT-related incidents according to their priority and severity and according to the criticality of the services impacted;
(c) assign roles and responsibilities that need to be activated for different ICT-related incident types and scenarios;
(d) set out plans for communication to staff, external stakeholders and media in accordance with Article 14 and for notification to clients, for internal escalation procedures, including ICT-related customer complaints, as well as for the provision of information to financial entities that act as counterparts, as appropriate.`,
    normalizedText: `Financial entities must implement ICT incident management processes to detect, manage, and notify incidents. All incidents and cyber threats must be recorded with procedures for consistent monitoring and follow-up to identify and address root causes. The process must include early warning indicators, classification procedures by priority/severity, role assignments for different incident types, and communication plans for staff, stakeholders, media, and clients.`,
    riskLevel: 'high',
  },
  {
    articleNumber: 'Article 19',
    sectionTitle: 'Chapter III - ICT-related Incident Management',
    title: 'Reporting of major ICT-related incidents and voluntary notification of significant cyber threats',
    rawText: `Financial entities shall report major ICT-related incidents to the relevant competent authority in accordance with paragraph 4.

Where a financial entity is subject to supervision by more than one national competent authority referred to in Article 46, Member States shall designate a single competent authority as the relevant competent authority responsible for carrying out the functions and duties provided for in this Article.

The report referred to in paragraph 1 shall include all information necessary to enable the competent authority to determine the significance of the major ICT-related incident and assess possible cross-border impacts.

The initial notification shall be submitted not later than the end of the business day, or, where the major ICT-related incident occurred less than 2 hours before the end of the business day, not later than 4 hours from the beginning of the next business day.`,
    normalizedText: `Financial entities must report major ICT incidents to the relevant competent authority, including all information for determining significance and cross-border impacts. Initial notification deadline is end of business day, or within 4 hours of the next business day if the incident occurred less than 2 hours before close.`,
    riskLevel: 'critical',
  },
  {
    articleNumber: 'Article 24',
    sectionTitle: 'Chapter IV - Digital Operational Resilience Testing',
    title: 'General requirements for the performance of digital operational resilience testing',
    rawText: `For the purpose of assessing preparedness for handling ICT-related incidents, of identifying weaknesses, deficiencies and gaps in digital operational resilience, and of promptly implementing corrective measures, financial entities, other than microenterprises, shall, taking into account the criteria set out in Article 4(2), establish, maintain and review a sound and comprehensive digital operational resilience testing programme as an integral part of the ICT risk-management framework referred to in Article 6.

The digital operational resilience testing programme shall include a range of assessments, tests, methodologies, practices and tools to be applied in accordance with Articles 25 and 26.

When carrying out the digital operational resilience testing programme referred to in paragraph 1, financial entities shall follow a risk-based approach taking due account of the evolving landscape of ICT risk, any specific risks to which the financial entity concerned is or might be exposed, the criticality of information assets and of services provided, as well as any other factor the financial entity deems appropriate.`,
    normalizedText: `Financial entities (except microenterprises) must establish a comprehensive digital operational resilience testing programme within their ICT risk management framework to assess incident preparedness, identify weaknesses, and implement corrections. The programme must include various assessments, tests, and methodologies following a risk-based approach considering ICT risk landscape, specific risks, criticality of assets and services.`,
    riskLevel: 'high',
  },
  {
    articleNumber: 'Article 28',
    sectionTitle: 'Chapter V - Managing ICT Third-Party Risk',
    title: 'General principles',
    rawText: `Financial entities shall manage ICT third-party risk as an integral component of ICT risk within their ICT risk management framework as referred to in Article 6(1), and in accordance with the following principles:

(a) financial entities that have in place contractual arrangements for the use of ICT services to run their business operations shall at all times remain fully responsible for compliance with, and the discharge of, all obligations under this Regulation and applicable financial services law;

(b) financial entities' management of ICT third-party risk shall be implemented in light of the principle of proportionality, taking into account:
(i) the nature, scale, complexity and importance of ICT-related dependencies,
(ii) the risks arising from contractual arrangements on the use of ICT services concluded with ICT third-party service providers, taking into account the criticality or importance of the respective service, process or function, and the potential impact on the continuity and availability of financial services and activities, at individual and at group level where applicable.`,
    normalizedText: `Financial entities must manage ICT third-party risk within their risk management framework. They remain fully responsible for regulatory compliance regardless of third-party arrangements. Management must be proportionate, considering the nature/scale/complexity of ICT dependencies and risks from service provider contracts, including criticality and potential impact on service continuity and availability.`,
    riskLevel: 'critical',
  },
]

// =============================================================================
// GDPR Articles - Actual excerpts from (EU) 2016/679
// =============================================================================

export const GDPR_ARTICLES: ArticleSeed[] = [
  {
    articleNumber: 'Article 5',
    sectionTitle: 'Chapter II - Principles',
    title: 'Principles relating to processing of personal data',
    rawText: `Personal data shall be:
(a) processed lawfully, fairly and in a transparent manner in relation to the data subject ('lawfulness, fairness and transparency');
(b) collected for specified, explicit and legitimate purposes and not further processed in a manner that is incompatible with those purposes; further processing for archiving purposes in the public interest, scientific or historical research purposes or statistical purposes shall, in accordance with Article 89(1), not be considered to be incompatible with the initial purposes ('purpose limitation');
(c) adequate, relevant and limited to what is necessary in relation to the purposes for which they are processed ('data minimisation');
(d) accurate and, where necessary, kept up to date; every reasonable step must be taken to ensure that personal data that are inaccurate, having regard to the purposes for which they are processed, are erased or rectified without delay ('accuracy');
(e) kept in a form which permits identification of data subjects for no longer than is necessary for the purposes for which the personal data are processed ('storage limitation');
(f) processed in a manner that ensures appropriate security of the personal data, including protection against unauthorised or unlawful processing and against accidental loss, destruction or damage, using appropriate technical or organisational measures ('integrity and confidentiality').

The controller shall be responsible for, and be able to demonstrate compliance with, paragraph 1 ('accountability').`,
    normalizedText: `Personal data must be: processed lawfully, fairly, and transparently; collected for specified, legitimate purposes; adequate, relevant, and limited to necessity; accurate and kept up to date; kept only as long as necessary; and secured against unauthorized processing and accidental loss. Controllers must be accountable and demonstrate compliance.`,
    riskLevel: 'critical',
  },
  {
    articleNumber: 'Article 6',
    sectionTitle: 'Chapter II - Principles',
    title: 'Lawfulness of processing',
    rawText: `Processing shall be lawful only if and to the extent that at least one of the following applies:
(a) the data subject has given consent to the processing of his or her personal data for one or more specific purposes;
(b) processing is necessary for the performance of a contract to which the data subject is party or in order to take steps at the request of the data subject prior to entering into a contract;
(c) processing is necessary for compliance with a legal obligation to which the controller is subject;
(d) processing is necessary in order to protect the vital interests of the data subject or of another natural person;
(e) processing is necessary for the performance of a task carried out in the public interest or in the exercise of official authority vested in the controller;
(f) processing is necessary for the purposes of the legitimate interests pursued by the controller or by a third party, except where such interests are overridden by the interests or fundamental rights and freedoms of the data subject which require protection of personal data, in particular where the data subject is a child.`,
    normalizedText: `Processing is lawful only when: consent is given; necessary for contract performance; required by legal obligation; necessary to protect vital interests; necessary for public interest tasks; or necessary for legitimate interests unless overridden by data subject's rights, especially for children.`,
    riskLevel: 'critical',
  },
  {
    articleNumber: 'Article 17',
    sectionTitle: 'Chapter III - Rights of the Data Subject',
    title: 'Right to erasure ("right to be forgotten")',
    rawText: `The data subject shall have the right to obtain from the controller the erasure of personal data concerning him or her without undue delay and the controller shall have the obligation to erase personal data without undue delay where one of the following grounds applies:
(a) the personal data are no longer necessary in relation to the purposes for which they were collected or otherwise processed;
(b) the data subject withdraws consent on which the processing is based according to point (a) of Article 6(1), or point (a) of Article 9(2), and where there is no other legal ground for the processing;
(c) the data subject objects to the processing pursuant to Article 21(1) and there are no overriding legitimate grounds for the processing, or the data subject objects to the processing pursuant to Article 21(2);
(d) the personal data have been unlawfully processed;
(e) the personal data have to be erased for compliance with a legal obligation in Union or Member State law to which the controller is subject;
(f) the personal data have been collected in relation to the offer of information society services referred to in Article 8(1).`,
    normalizedText: `Data subjects have the right to erasure without undue delay when: data is no longer necessary; consent is withdrawn with no other legal basis; subject objects with no overriding grounds; data was unlawfully processed; erasure is required by law; or data relates to children's information society services.`,
    riskLevel: 'high',
  },
  {
    articleNumber: 'Article 25',
    sectionTitle: 'Chapter IV - Controller and Processor',
    title: 'Data protection by design and by default',
    rawText: `Taking into account the state of the art, the cost of implementation and the nature, scope, context and purposes of processing as well as the risks of varying likelihood and severity for rights and freedoms of natural persons posed by the processing, the controller shall, both at the time of the determination of the means for processing and at the time of the processing itself, implement appropriate technical and organisational measures, such as pseudonymisation, which are designed to implement data-protection principles, such as data minimisation, in an effective manner and to integrate the necessary safeguards into the processing in order to meet the requirements of this Regulation and protect the rights of data subjects.

The controller shall implement appropriate technical and organisational measures for ensuring that, by default, only personal data which are necessary for each specific purpose of the processing are processed.`,
    normalizedText: `Controllers must implement technical and organizational measures (like pseudonymization) at design time and during processing, considering state of the art, costs, processing nature, and risks. Measures must effectively implement data protection principles and safeguards. By default, only data necessary for each specific purpose should be processed.`,
    riskLevel: 'high',
  },
  {
    articleNumber: 'Article 32',
    sectionTitle: 'Chapter IV - Controller and Processor',
    title: 'Security of processing',
    rawText: `Taking into account the state of the art, the costs of implementation and the nature, scope, context and purposes of processing as well as the risk of varying likelihood and severity for the rights and freedoms of natural persons, the controller and the processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk, including inter alia as appropriate:
(a) the pseudonymisation and encryption of personal data;
(b) the ability to ensure the ongoing confidentiality, integrity, availability and resilience of processing systems and services;
(c) the ability to restore the availability and access to personal data in a timely manner in the event of a physical or technical incident;
(d) a process for regularly testing, assessing and evaluating the effectiveness of technical and organisational measures for ensuring the security of the processing.`,
    normalizedText: `Controllers and processors must implement technical and organizational security measures appropriate to the risk, including: pseudonymization and encryption; ongoing confidentiality, integrity, availability, and resilience; timely restoration after incidents; and regular testing and evaluation of security measures.`,
    riskLevel: 'critical',
  },
  {
    articleNumber: 'Article 33',
    sectionTitle: 'Chapter IV - Controller and Processor',
    title: 'Notification of a personal data breach to the supervisory authority',
    rawText: `In the case of a personal data breach, the controller shall without undue delay and, where feasible, not later than 72 hours after having become aware of it, notify the personal data breach to the supervisory authority competent in accordance with Article 55, unless the personal data breach is unlikely to result in a risk to the rights and freedoms of natural persons. Where the notification to the supervisory authority is not made within 72 hours, it shall be accompanied by reasons for the delay.

The notification referred to in paragraph 1 shall at least:
(a) describe the nature of the personal data breach including where possible, the categories and approximate number of data subjects concerned and the categories and approximate number of personal data records concerned;
(b) communicate the name and contact details of the data protection officer or other contact point where more information can be obtained;
(c) describe the likely consequences of the personal data breach;
(d) describe the measures taken or proposed to be taken by the controller to address the personal data breach.`,
    normalizedText: `Controllers must notify the supervisory authority within 72 hours of becoming aware of a personal data breach, unless it's unlikely to risk rights and freedoms. Notification must describe: breach nature and scope; DPO contact; likely consequences; and remedial measures taken or proposed.`,
    riskLevel: 'critical',
  },
  {
    articleNumber: 'Article 35',
    sectionTitle: 'Chapter IV - Controller and Processor',
    title: 'Data protection impact assessment',
    rawText: `Where a type of processing in particular using new technologies, and taking into account the nature, scope, context and purposes of the processing, is likely to result in a high risk to the rights and freedoms of natural persons, the controller shall, prior to the processing, carry out an assessment of the impact of the envisaged processing operations on the protection of personal data. A single assessment may address a set of similar processing operations that present similar high risks.

A data protection impact assessment referred to in paragraph 1 shall in particular be required in the case of:
(a) a systematic and extensive evaluation of personal aspects relating to natural persons which is based on automated processing, including profiling, and on which decisions are based that produce legal effects concerning the natural person or similarly significantly affect the natural person;
(b) processing on a large scale of special categories of data referred to in Article 9(1), or of personal data relating to criminal convictions and offences referred to in Article 10;
(c) a systematic monitoring of a publicly accessible area on a large scale.`,
    normalizedText: `Controllers must conduct DPIAs before processing likely to cause high risk, especially for: automated decision-making with legal effects; large-scale processing of special category data; or large-scale systematic monitoring of public areas. DPIAs must consider nature, scope, context, purposes, and new technologies.`,
    riskLevel: 'high',
  },
]

// =============================================================================
// PSD2 Articles (abbreviated set for demo)
// =============================================================================

export const PSD2_ARTICLES: ArticleSeed[] = [
  {
    articleNumber: 'Article 97',
    sectionTitle: 'Chapter 4 - Security Measures',
    title: 'Authentication',
    rawText: `Member States shall ensure that a payment service provider applies strong customer authentication where the payer:
(a) accesses its payment account online;
(b) initiates an electronic payment transaction;
(c) carries out any action through a remote channel which may imply a risk of payment fraud or other abuses.`,
    normalizedText: `Payment service providers must apply strong customer authentication when payers access accounts online, initiate electronic payments, or perform remote actions with fraud risk.`,
    riskLevel: 'critical',
  },
  {
    articleNumber: 'Article 98',
    sectionTitle: 'Chapter 4 - Security Measures',
    title: 'Regulatory technical standards on authentication and communication',
    rawText: `EBA shall, in close cooperation with the ECB and after consulting all relevant stakeholders, including those in the e-commerce market, reflecting all interests involved, develop draft regulatory technical standards addressed to payment service providers.`,
    normalizedText: `EBA develops regulatory technical standards for payment service providers regarding authentication and communication, in cooperation with ECB and stakeholders.`,
    riskLevel: 'high',
  },
]

/**
 * Get articles for a regulation by framework
 */
export function getArticlesForFramework(framework: string): ArticleSeed[] {
  switch (framework.toUpperCase()) {
    case 'DORA':
      return DORA_ARTICLES
    case 'GDPR':
      return GDPR_ARTICLES
    case 'PSD2':
      return PSD2_ARTICLES
    default:
      return []
  }
}
