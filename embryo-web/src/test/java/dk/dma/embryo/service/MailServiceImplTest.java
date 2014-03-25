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
package dk.dma.embryo.service;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import javax.ejb.EJBException;
import javax.enterprise.inject.Produces;
import javax.inject.Inject;
import javax.mail.MessagingException;

import org.jglue.cdiunit.AdditionalClasses;
import org.jglue.cdiunit.CdiRunner;
import org.joda.time.DateTime;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;

import dk.dma.embryo.common.configuration.PropertyFileService;
import dk.dma.embryo.configuration.LogConfiguration;
import dk.dma.embryo.domain.GreenPosDeviationReport;
import dk.dma.embryo.domain.GreenPosFinalReport;
import dk.dma.embryo.domain.GreenPosPositionReport;
import dk.dma.embryo.domain.GreenPosSailingPlanReport;
import dk.dma.embryo.domain.Position;
import dk.dma.embryo.domain.ReportedRoute;
import dk.dma.embryo.domain.ReportedWayPoint;
import dk.dma.embryo.domain.SecuredUser;
import dk.dma.embryo.mail.MailSender;
import dk.dma.embryo.rest.RequestAccessRestService.SignupRequest;
import dk.dma.embryo.security.Subject;
import dk.dma.embryo.util.DateTimeConverter;

/**
 * @author Jesper Tejlgaard
 */
@RunWith(CdiRunner.class)
@AdditionalClasses(value = { PropertyFileService.class, LogConfiguration.class })
public class MailServiceImplTest {
    // mocks
    
    @Produces
    @Mock
    EmbryoLogService logService;

    @Produces
    @Mock
    Subject subject;

    @Produces
    @Mock
    MailSender mailSender;

    @Inject
    private MailServiceImpl mailService;

    @Test
    public void testSendDeviationReport_noWaypoints() throws MessagingException {
        // SETUP MOCKS
        when(subject.getUser()).thenReturn(new SecuredUser("name", "pwd", new byte[0], "test@test.dk"));

        // TEST DATA
        GreenPosDeviationReport report = new GreenPosDeviationReport("MyVessel", 12L, "callsign", new Position(10.0,
                10.0), "My Deviation Description");
        report.setTs(DateTimeConverter.getDateTimeConverter("MM").toObject("01-01-2014 12:00:34"));

        // EXECUTE
        mailService.newGreenposReport(report);

        // VERIFY
        String header = "ArcticWeb Greenpos Deviation Report from MyVessel";
        String body = "A (Vessel): MyVessel/callsign MMSI 12\n";
        body += "B (Report time): 01-01-2014 12:00:34 UTC\n";
        body += "C (Position): 10 00.000N 010 00.000E\n";
        body += "L (Deviation): My Deviation Description\n";
        body += "L (Route WayPoints): -\n";
        body += "\n";
        body += "Reported via ArcticWeb.";

        verify(mailSender).sendEmail("arktiskcom@gmail.com", "test@test.dk", header, body);
    }

    @Test
    public void testSendDeviationReport_withWaypoints() throws MessagingException {
        // SETUP MOCKS
        when(subject.getUser()).thenReturn(new SecuredUser("name", "pwd", new byte[0], "test@test.dk"));

        // TEST DATA
        GreenPosDeviationReport report = new GreenPosDeviationReport("MyVessel", 12L, "callsign", new Position(10.0,
                10.0), "My Deviation Description");
        report.setTs(DateTimeConverter.getDateTimeConverter("MM").toObject("01-01-2014 12:00:34"));
        ReportedRoute route = new ReportedRoute("mykey", "myroute");
        route.addWayPoint(new ReportedWayPoint("wp1", 10.0, 10.0));
        route.addWayPoint(new ReportedWayPoint("wp2", 12.0, 12.0));
        report.setRoute(route);

        // EXECUTE
        mailService.newGreenposReport(report);

        // VERIFY
        String header = "ArcticWeb Greenpos Deviation Report from MyVessel";
        String body = "A (Vessel): MyVessel/callsign MMSI 12\n";
        body += "B (Report time): 01-01-2014 12:00:34 UTC\n";
        body += "C (Position): 10 00.000N 010 00.000E\n";
        body += "L (Deviation): My Deviation Description\n";
        body += "L (Route WayPoints): [10 00.000N,010 00.000E],  [12 00.000N,012 00.000E]\n";
        body += "\n";
        body += "Reported via ArcticWeb.";

        verify(mailSender).sendEmail("arktiskcom@gmail.com", "test@test.dk", header, body);
    }

    @Test
    public void testSendSailingPlanReport_withRouteData() throws MessagingException {
        // SETUP MOCKS
        when(subject.getUser()).thenReturn(new SecuredUser("name", "pwd", new byte[0], "test@test.dk"));

        // TEST DATA
        DateTime eta = DateTimeConverter.getDateTimeConverter("MS").toObject("02-02-2014 12:00");
        GreenPosSailingPlanReport report = new GreenPosSailingPlanReport("MyVessel", 12L, "callsign", new Position(
                10.0, 10.0), "My Weather", "My Ice", 1.0, 230, "Nuuk", eta, 12, "My Route Description");
        report.setTs(DateTimeConverter.getDateTimeConverter("MM").toObject("01-02-2014 14:01:25"));
        ReportedRoute route = new ReportedRoute("mykey", "myroute");
        route.addWayPoint(new ReportedWayPoint("wp1", 10.0, 10.0));
        route.addWayPoint(new ReportedWayPoint("wp2", 12.0, 12.0));
        report.setRoute(route);

        // EXECUTE
        mailService.newGreenposReport(report);

        // VERIFY
        String header = "ArcticWeb Greenpos Sailing Plan Report from MyVessel";
        String body = "A (Vessel): MyVessel/callsign MMSI 12\n";
        body += "B (Report time): 01-02-2014 14:01:25 UTC\n";
        body += "C (Position): 10 00.000N 010 00.000E\n";
        body += "E (Course): 230\n";
        body += "F (Speed): 1.0\n";
        body += "I (Destination & ETA): Nuuk, 02-02-2014 12:00 UTC\n";
        body += "X (Persons on Board): 12\n";
        body += "S (Ice): My Ice\n";
        body += "S (Weather): My Weather\n";
        body += "L (Route Description): My Route Description\n";
        body += "L (Route WayPoints): [10 00.000N,010 00.000E],  [12 00.000N,012 00.000E]\n";
        body += "\n";
        body += "Reported via ArcticWeb.";

        verify(mailSender).sendEmail("arktiskcom@gmail.com", "test@test.dk", header, body);
    }

    @Test
    public void testSendSailingPlanReport_noRouteData() throws MessagingException {
        // SETUP MOCKS
        when(subject.getUser()).thenReturn(new SecuredUser("name", "pwd", new byte[0], "test@test.dk"));

        // TEST DATA
        DateTime eta = DateTimeConverter.getDateTimeConverter("MS").toObject("02-02-2014 12:00");
        GreenPosSailingPlanReport report = new GreenPosSailingPlanReport("MyVessel", 12L, "callsign", new Position(
                10.0, 10.0), "My Weather", "My Ice", 1.0, 230, "Nuuk", eta, 12, null);
        report.setTs(DateTimeConverter.getDateTimeConverter("MM").toObject("01-02-2014 14:01:25"));

        // EXECUTE
        mailService.newGreenposReport(report);

        // VERIFY
        String header = "ArcticWeb Greenpos Sailing Plan Report from MyVessel";
        String body = "A (Vessel): MyVessel/callsign MMSI 12\n";
        body += "B (Report time): 01-02-2014 14:01:25 UTC\n";
        body += "C (Position): 10 00.000N 010 00.000E\n";
        body += "E (Course): 230\n";
        body += "F (Speed): 1.0\n";
        body += "I (Destination & ETA): Nuuk, 02-02-2014 12:00 UTC\n";
        body += "X (Persons on Board): 12\n";
        body += "S (Ice): My Ice\n";
        body += "S (Weather): My Weather\n";
        body += "L (Route Description): -\n";
        body += "L (Route WayPoints): -\n";
        body += "\n";
        body += "Reported via ArcticWeb.";

        verify(mailSender).sendEmail("arktiskcom@gmail.com", "test@test.dk", header, body);
    }

    @Test
    public void testSendFinalReport() throws MessagingException {
        // SETUP MOCKS
        when(subject.getUser()).thenReturn(new SecuredUser("name", "pwd", new byte[0], "test@test.dk"));

        // TEST DATA
        GreenPosFinalReport report = new GreenPosFinalReport("MyVessel", 12L, "callsign", new Position(10.0, 10.0),
                "My Weather", "My Ice");
        report.setTs(DateTimeConverter.getDateTimeConverter("MM").toObject("01-02-2014 14:01:25"));

        // EXECUTE
        mailService.newGreenposReport(report);

        // VERIFY
        String header = "ArcticWeb Greenpos Final Report from MyVessel";
        String body = "A (Vessel): MyVessel/callsign MMSI 12\n";
        body += "B (Report time): 01-02-2014 14:01:25 UTC\n";
        body += "C (Position): 10 00.000N 010 00.000E\n";
        body += "S (Ice): My Ice\n";
        body += "S (Weather): My Weather\n";
        body += "\n";
        body += "Reported via ArcticWeb.";

        verify(mailSender).sendEmail("arktiskcom@gmail.com", "test@test.dk", header, body);
    }

    @Test
    public void testSendPositionReport() throws MessagingException {
        // SETUP MOCKS
        when(subject.getUser()).thenReturn(new SecuredUser("name", "pwd", new byte[0], "test@test.dk"));

        // TEST DATA
        GreenPosPositionReport report = new GreenPosPositionReport("MyVessel", 12L, "callsign", new Position(10.0, 10.0),
                "My Weather", "My Ice", 2.0, 134);
        report.setTs(DateTimeConverter.getDateTimeConverter("MM").toObject("01-02-2014 06:03:25"));

        // EXECUTE
        mailService.newGreenposReport(report);

        // VERIFY
        String header = "ArcticWeb Greenpos Position Report from MyVessel";
        String body = "A (Vessel): MyVessel/callsign MMSI 12\n";
        body += "B (Report time): 01-02-2014 06:03:25 UTC\n";
        body += "C (Position): 10 00.000N 010 00.000E\n";
        body += "E (Course): 134\n";
        body += "F (Speed): 2.0\n";
        body += "S (Ice): My Ice\n";
        body += "S (Weather): My Weather\n";
        body += "\n";
        body += "Reported via ArcticWeb.";

        verify(mailSender).sendEmail("arktiskcom@gmail.com", "test@test.dk", header, body);
    }

    @Test
    public void testSendRequestAccess() throws MessagingException {
        // SETUP MOCKS
        when(subject.getUser()).thenReturn(new SecuredUser("name", "pwd", new byte[0], "test@test.dk"));

        // TEST DATA
        SignupRequest request = new SignupRequest();
        request.setContactPerson("John Doe");
        request.setEmailAddress("john@doe.com");
        request.setMmsiNumber(12L);
        request.setPreferredLogin("john");

        // EXECUTE
        mailService.newRequestAccess(request);

        // VERIFY
        String header = "Request Access for john@doe.com";
        String body = "Preferred Login: john\n";
        body += "Contact Person: John Doe\n";
        body += "Email Address: john@doe.com\n";
        body += "Mmsi Number: 12";

        verify(mailSender).sendEmail("arktiskcom@gmail.com", "noreply@dma.dk", header, body);
    }


    @Test
    public void testSendDmiNotification() throws MessagingException {
        // SETUP MOCKS
        when(subject.getUser()).thenReturn(new SecuredUser("name", "pwd", new byte[0], "test@test.dk"));

        // TEST DATA
        String iceChart = "my ice chart";
        Throwable t = new EJBException(new RuntimeException("Expected to read lots of bytes"));

        // EXECUTE
        mailService.dmiNotification(iceChart, t);

        // VERIFY
        String header = "ArcticWeb detected an error importing ice chart " + iceChart;
        String body = "Ice Chart: " + iceChart + "\n";
        body += "Message: Possible corrupt ice chart. You may want to delete the ice chart.\n";
        body += "Error: java.lang.RuntimeException: Expected to read lots of bytes";

        verify(mailSender).sendEmail("arktiskcom@gmail.com", "noreply@dma.dk", header, body);
    }
}
