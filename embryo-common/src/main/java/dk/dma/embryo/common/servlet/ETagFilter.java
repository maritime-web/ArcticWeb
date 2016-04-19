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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServletResponseWrapper;
import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.stream.Collectors;
import static dk.dma.embryo.common.servlet.ETagFilter.Headers.ETAG;
import static dk.dma.embryo.common.servlet.ETagFilter.Headers.IF_MODIFIED_SINCE;
import static dk.dma.embryo.common.servlet.ETagFilter.Headers.IF_NONE_MATCH;
import static dk.dma.embryo.common.servlet.ETagFilter.Headers.LAST_MODIFIED;

public class ETagFilter implements Filter {

    private final ResourceManager resourceManager;

    private final Logger LOGGER = LoggerFactory.getLogger(ETagFilter.class);

    private String basePath;

    @Inject
    public ETagFilter(ResourceManager resourceManager){
        this.resourceManager = resourceManager;
    }

    public void init(FilterConfig filterConfig) throws ServletException {
        basePath = filterConfig.getServletContext().getRealPath(File.separator);
        LOGGER.info("Initialized with base path{} ", basePath);
    }

    public void destroy() {
        LOGGER.info("destroy...");
    }

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;

        Resource requestedResource = resourceManager.getRequestedResource(basePath, req.getServletPath());

        LOGGER.trace("{}, {}={}, {}={}", req.getServletPath(), IF_NONE_MATCH, req.getHeader(IF_NONE_MATCH), IF_MODIFIED_SINCE, req.getHeader(IF_MODIFIED_SINCE));

        if(requestedResource.exists()){
            if (requestedResource.getETag().matches(req.getHeader(IF_NONE_MATCH))) {
                String eTag = requestedResource.getETag().getValue();
                resp.setStatus(HttpServletResponse.SC_NOT_MODIFIED);
                resp.setHeader(ETAG, eTag);
                LOGGER.debug("{} value ({}) matches {}. Setting status code {}", IF_NONE_MATCH, req.getHeader(IF_NONE_MATCH), eTag, HttpServletResponse.SC_NOT_MODIFIED);
                return;
            } else if (req.getHeader(IF_MODIFIED_SINCE) != null){
                // Previous version of ArcticWeb (2.5.3 and earlier) did not use ETag but Last-Modified header
                // remove If-Modified-Since to force reload of resource
                // This needs to be maintained for at least a year as some users only use ArcticWeb once a year
                LOGGER.debug("{} header present in request. Ignoring.", IF_MODIFIED_SINCE);
                request = new IgnoreIfModifiedSinceRequestWrapper(req);
            }

            LOGGER.debug("Adding response header {}", ETAG);
            resp.setHeader(ETAG, requestedResource.getETag().getValue());

            resp =  new IgnoreLastModifiedResponseWrapper(resp);
        } else{
            LOGGER.debug("Requested resource {} not existing", req.getServletPath());
        }

        chain.doFilter(request, resp);
    }

    static final class Headers{
        public static final String IF_MODIFIED_SINCE = "If-Modified-Since";
        public static final String IF_NONE_MATCH = "If-None-Match";
        public static final String ETAG = "ETag";
        public static final String LAST_MODIFIED = "Last-Modified";

    }

    static final class IgnoreLastModifiedResponseWrapper extends HttpServletResponseWrapper {

        public IgnoreLastModifiedResponseWrapper(HttpServletResponse response){
            super(response);
        }

        @Override
        public void setHeader(String name, String value) {
            if(!LAST_MODIFIED.equals(name)){
                super.setHeader(name, value);
            }
        }
    }

    static final class IgnoreIfModifiedSinceRequestWrapper extends HttpServletRequestWrapper{

        public IgnoreIfModifiedSinceRequestWrapper(HttpServletRequest request) {
            super(request);
        }

        @Override
        public String getHeader(String name) {
            if(IF_MODIFIED_SINCE.equals(name)){
                return null;
            }
            return super.getHeader(name);
        }

        @Override
        public Enumeration<String> getHeaderNames() {
            List<String> headerNames = Collections.list(super.getHeaderNames());
            List<String> filtered = headerNames.stream().filter(name -> !IF_MODIFIED_SINCE.equals(name)).collect(Collectors.toList());
            return Collections.enumeration(filtered);
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            if(IF_MODIFIED_SINCE.equals(name)){
                return null;
            }
            return super.getHeaders(name);
        }
    }
}
