/* Copyright (c) 2011 Danish Maritime Authority
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this library.  If not, see <http://www.gnu.org/licenses/>.
 */
package dk.dma.arcticweb.service;

import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.regex.Matcher;

import javax.annotation.PostConstruct;
import javax.ejb.TransactionAttribute;
import javax.ejb.TransactionAttributeType;
import javax.inject.Inject;
import javax.inject.Named;
import javax.mail.Message;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

import org.slf4j.Logger;

import dk.dma.configuration.Property;
import dk.dma.configuration.PropertyFileService;
import dk.dma.embryo.domain.GreenPosDMIReport;
import dk.dma.embryo.domain.GreenPosDeviationReport;
import dk.dma.embryo.domain.GreenPosFinalReport;
import dk.dma.embryo.domain.GreenPosPositionReport;
import dk.dma.embryo.domain.GreenPosReport;
import dk.dma.embryo.domain.GreenPosSailingPlanReport;
import dk.dma.embryo.rest.RequestAccessRestService;

@Named
@TransactionAttribute(TransactionAttributeType.SUPPORTS)
public class MailServiceImpl implements MailService {

    @Inject
    private Logger logger;

    @Inject
    private EmbryoLogService embryoLogService;

    @Inject
    @Property("embryo.notification.mail.to.greenpos")
    private String greenposToEmail;

    @Inject
    @Property("embryo.notification.mail.to.requestAccess")
    private String requestAccessToEmail;

    @Inject
    @Property("embryo.notification.mail.from")
    private String fromEmail;

    @Inject
    @Property("embryo.notification.mail.smtp.host")
    private String smtpHost;

    @Inject
    @Property(value = "embryo.notification.mail.smtp.username", defaultValue = " ")
    private String username;

    @Inject
    @Property(value = "embryo.notification.mail.smtp.password", defaultValue = " ")
    private String password;

    @Inject
    @Property("embryo.notification.mail.enabled")
    private String enabled;

    @Inject
    private PropertyFileService propertyFileService;

    public MailServiceImpl() {
    }

    @PostConstruct
    public void init() {
        if (enabled == null || !"TRUE".equals(enabled.toUpperCase())) {
            logger.info("ArcticWeb MAIL SERVICE DISABLED");
        } else {
            logger.info("ArcticWeb MAIL SERVICE ENABLED");
        }
    }

    private void sendEmail(String toEmail, String header, String body) {

        logger.debug("enabled=" + enabled);

        if (enabled == null || !"TRUE".equals(enabled.toUpperCase())) {
            logger.info("Email sending has been disabled. Would have sent the following to " + toEmail + ":\n" + header + "\n" + body);
            return;
        }

        Properties properties = new Properties();

        properties.put("mail.smtp.host", smtpHost);

        Session session;

        if (username == null || username.trim().equals("")) {
            session = Session.getDefaultInstance(properties);
        } else {
            properties.put("mail.smtp.auth", "true");
            properties.put("mail.smtp.starttls.enable", "true");
            properties.put("mail.smtp.port", "587");

            session = Session.getInstance(properties,
                    new javax.mail.Authenticator() {
                        protected PasswordAuthentication getPasswordAuthentication() {
                            return new PasswordAuthentication(username, password);
                        }
                    });
        }

        try {
            MimeMessage message = new MimeMessage(session);

            message.setFrom(new InternetAddress(fromEmail));

            for (String email : toEmail.split(";")) {
                message.addRecipient(Message.RecipientType.TO, new InternetAddress(email));
            }

            message.setSubject(header);

            message.setText(body);

            Transport.send(message);

            logger.info("The following email to "+toEmail+" have been sent:\n" + header + "\n" + body);
        } catch (Exception mex) {
            throw new RuntimeException(mex);
        }
    }

    private String applyTemplate(String template, Map<String, String> environment) {
        String result = template;

        for (String key : environment.keySet()) {
            String value = environment.get(key);

            if (value == null) {
                value = "-";
            }

            value = Matcher.quoteReplacement(value);

            result = result.replaceAll("\\{" + key + "\\}", value);
        }

        return result;
    }

    public void newRequestAccess(RequestAccessRestService.SignupRequest request) {
        try {
            Map<String, String> environment = new HashMap<>();

            environment.put("PreferredLogin", request.getPreferredLogin());
            environment.put("ContactPerson", request.getContactPerson());
            environment.put("EmailAddress", request.getEmailAddress());
            environment.put("MmsiNumber", request.getMmsiNumber() != null ? ("" + request.getMmsiNumber()) : "-");

            String header = propertyFileService.getProperty("embryo.notification.template.signupRequest.header");
            String body = propertyFileService.getProperty("embryo.notification.template.signupRequest.body");

            sendEmail(requestAccessToEmail, applyTemplate(header, environment), applyTemplate(body, environment));

            embryoLogService.info(applyTemplate(header, environment) + " sent to " + requestAccessToEmail);
        } catch (Throwable t) {
            embryoLogService.error("Error sending sign up request to " + requestAccessToEmail, t);
            throw new RuntimeException(t);
        }
    }

    @Override
    public void newGreenposReport(GreenPosReport report) {
        try {
            Map<String, String> environment = new HashMap<>();

            environment.put("VesselName", report.getVesselName());
            environment.put("VesselMmsi", "" + report.getVesselMmsi());
            environment.put("VesselCallSign", report.getVesselCallSign());
            environment.put("Latitude", report.getPosition().getLatitudeAsString());
            environment.put("Longitude", report.getPosition().getLongitudeAsString());

            String templateName = "greenposReport";

            if (report instanceof GreenPosDMIReport) {
                environment.put("IceInformation", ((GreenPosDMIReport) report).getIceInformation());
                environment.put("Weather", ((GreenPosDMIReport) report).getWeather());
            }

            if (report instanceof GreenPosPositionReport) {
                templateName = "greenposPositionReport";
                environment.put("Course", "" + ((GreenPosPositionReport) report).getCourse());
                environment.put("Speed", "" + ((GreenPosPositionReport) report).getSpeed());
            }
            if (report instanceof GreenPosSailingPlanReport) {
                environment.put("Destination", ((GreenPosSailingPlanReport) report).getDestination());
                environment.put("PersonsOnBoard", "" + ((GreenPosSailingPlanReport) report).getPersonsOnBoard());
                environment.put("EtaOfArrival", "" + ((GreenPosSailingPlanReport) report).getEtaOfArrival());
                templateName = "greenposSailingPlanReport";
            }
            if (report instanceof GreenPosFinalReport) {
                templateName = "greenposFinalReport";
            }
            if (report instanceof GreenPosDeviationReport) {
                environment.put("Deviation", ((GreenPosDeviationReport) report).getDeviation());
                templateName = "greenposDeviationReport";
            }

            String header = propertyFileService.getProperty("embryo.notification.template." + templateName + ".header");
            String body = propertyFileService.getProperty("embryo.notification.template." + templateName + ".body");

            sendEmail(greenposToEmail, applyTemplate(header, environment), applyTemplate(body, environment));

            embryoLogService.info(applyTemplate(header, environment) + " sent to " + greenposToEmail);

        } catch (Throwable t) {
            embryoLogService.error("Error sending " +
                    (report != null ? report.getClass().getSimpleName() : null) + "  to " + greenposToEmail, t
            );
            throw new RuntimeException(t);
        }
    }
}
