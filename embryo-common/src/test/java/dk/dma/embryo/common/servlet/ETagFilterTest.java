/* Copyright (c) 2011 Danish Maritime Authority.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package dk.dma.embryo.common.servlet;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

/**
 * Created by Jesper Tejlgaard on 4/19/16.
 */
public class ETagFilterTest {
    private ResourceManager resourceManager;
    private HttpServletRequest request;
    private HttpServletResponse response;
    private FilterChain filterChain;

    @Before
    public void setup(){
        resourceManager = Mockito.mock(ResourceManager.class);
        request = Mockito.mock(HttpServletRequest.class);
        response = Mockito.mock(HttpServletResponse.class);
        filterChain = Mockito.mock(FilterChain.class);
    }

    @Test
    public void testLastModifiedHeaderExcludedFromResponse() throws Exception{
        String path = "src/test/resources/default-configuration.properties";
        File file = new File(path);
        Mockito.when(request.getServletPath()).thenReturn(path);
        Mockito.when(resourceManager.getRequestedResource(null, path)).thenReturn(new Resource(file));

        Set<Boolean> doFilterCalled = new HashSet<>();

        FilterChain filterChain = new FilterChain() {
            @Override
            public void doFilter(ServletRequest request, ServletResponse resp) throws IOException, ServletException {
                HttpServletResponse response = (HttpServletResponse)resp;
                doFilterCalled.add(Boolean.TRUE);
                response.setHeader("Last-Modified", new Date().toString());
            }
        };

        ETagFilter filter = new ETagFilter(resourceManager);
        filter.doFilter(request, response, filterChain);

        Assert.assertEquals(1, doFilterCalled.size());
        Assert.assertNull(response.getHeader("Last-Modified"));
    }

    private String getLastModifiedString(long millis){
        //Thu, 07 Jan 2016 20:52:42 GMT

        return null;
    }

    @Test
    public void testIfModifiedSinceRequestHeaderIgnored() throws Exception{
        String path = "src/test/resources/default-configuration.properties";
        File file = new File(path);

        Mockito.when(request.getServletPath()).thenReturn(path);
        Mockito.when(resourceManager.getRequestedResource(null, path)).thenReturn(new Resource(file));

        Set<Boolean> doFilterCalled = new HashSet<>();

        FilterChain filterChain = new FilterChain() {
            @Override
            public void doFilter(ServletRequest req, ServletResponse resp) throws IOException, ServletException {
                // The correct test would have made assertions on the resulting response. It would however require the
                // behaviour of a full filter chain execution.
                // We therefore just test, that Last-Modified is not available as request header in the filter chain.
                doFilterCalled.add(Boolean.TRUE);
                HttpServletRequest request = (HttpServletRequest)req;
                Assert.assertNull(request.getHeader("Last-Modified"));
            }
        };

        ETagFilter filter = new ETagFilter(resourceManager);
        filter.doFilter(request, response, filterChain);

        Assert.assertEquals(1, doFilterCalled.size());
    }

    @Test
    public void testEtagAdded() throws Exception{
        String path = "src/test/resources/default-configuration.properties";
        File file = new File(path);

        Mockito.when(request.getServletPath()).thenReturn(path);
        Mockito.when(resourceManager.getRequestedResource(null, path)).thenReturn(new Resource(file));

        ETagFilter filter = new ETagFilter(resourceManager);
        filter.doFilter(request, response, filterChain);

        Mockito.verify(response).setHeader("ETag", file.length() + "_" + file.lastModified());
    }

    @Test
    public void testIfNoneMatchResourceUpdated() throws Exception{
        String path = "src/test/resources/default-configuration.properties";
        File file = new File(path);

        String oldEtag = (file.length() - 100) + "_" + (file.lastModified() - 100000);

        Mockito.when(request.getServletPath()).thenReturn(path);
        Mockito.when(request.getHeader("If-None-Match")).thenReturn(oldEtag);
        Mockito.when(resourceManager.getRequestedResource(null, path)).thenReturn(new Resource(file));

        ETagFilter filter = new ETagFilter(resourceManager);
        filter.doFilter(request, response, filterChain);

        Mockito.verify(response).setHeader("ETag", file.length() + "_" + file.lastModified());
    }

    @Test
    public void testIfNoneMatchResourceUnchanged() throws Exception{
        String path = "src/test/resources/default-configuration.properties";
        File file = new File(path);

        Mockito.when(request.getServletPath()).thenReturn(path);
        Mockito.when(resourceManager.getRequestedResource(null, path)).thenReturn(new Resource(file));

        Mockito.when(request.getHeader("If-None-Match")).thenReturn(file.length() + "_" + file.lastModified());

        ETagFilter filter = new ETagFilter(resourceManager);
        filter.doFilter(request, response, filterChain);

        Mockito.verify(response).setHeader("ETag", file.length() + "_" + file.lastModified());
        Mockito.verify(response).setStatus(304);
    }
}
