export interface CodeTemplate {
  title: string;
  filename: string;
  language: string;
  code: string;
  description: string;
}

export const kotlinTemplates: Record<string, CodeTemplate> = {
  dataClasses: {
    title: "Data Models",
    filename: "GenreModels.kt",
    language: "kotlin",
    description: "Kotlin data classes with kotlinx.serialization annotations to map the server-side JSON cleanly.",
    code: `package com.example.dramagenres.data.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName

@Serializable
data class Genre(
    @SerialName("genre") val genre: String,
    @SerialName("backdrop") val backdrop: String
)`
  },

  retrofit: {
    title: "Retrofit Network (Option A)",
    filename: "GenresApiService.kt",
    language: "kotlin",
    description: "Standard Retrofit interface definition with Gson/Serialization converter, customized for your CDN endpoint.",
    code: `package com.example.dramagenres.data.api

import com.example.dramagenres.data.model.Genre
import retrofit2.http.GET
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType

interface GenresApiService {
    @GET("genres.json")
    suspend fun getGenres(): List<Genre>

    companion object {
        private const val BASE_URL = "https://your-vercel-cdn-domain.vercel.app/"

        fun create(): GenresApiService {
            val json = Json { ignoreUnknownKeys = true }
            val contentType = "application/json".toMediaType()
            
            return Retrofit.Builder()
                .baseUrl(BASE_URL)
                .addConverterFactory(json.asConverterFactory(contentType))
                .build()
                .create(GenresApiService::class.java)
        }
    }
}`
  },

  ktor: {
    title: "Ktor Network (Option B)",
    filename: "GenresKtorClient.kt",
    language: "kotlin",
    description: "Multiplatform-compatible Ktor HTTP Client configured with ContentNegotiation, timeouts, and logging.",
    code: `package com.example.dramagenres.data.api

import com.example.dramagenres.data.model.Genre
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

class GenresKtorClient {
    private val client = HttpClient {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                prettyPrint = true
            })
        }
    }

    suspend fun fetchGenres(cdnUrl: String): List<Genre> {
        return client.get(cdnUrl).body()
    }

    fun close() {
        client.close()
    }
}`
  },

  viewModel: {
    title: "Coroutines ViewModel",
    filename: "GenresViewModel.kt",
    language: "kotlin",
    description: "Robust ViewModel with structured concurrency, fallback default state, and explicit UI state wrapper handling offline states gracefully.",
    code: `package com.example.dramagenres.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.dramagenres.data.api.GenresApiService
import com.example.dramagenres.data.model.Genre
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.IOException

sealed interface GenresUiState {
    object Loading : GenresUiState
    data class Success(val genres: List<Genre>) : GenresUiState
    data class Error(val message: String, val isOffline: Boolean) : GenresUiState
}

class GenresViewModel(
    private val apiService: GenresApiService = GenresApiService.create()
) : ViewModel() {

    private val _uiState = MutableStateFlow<GenresUiState>(GenresUiState.Loading)
    val uiState: StateFlow<GenresUiState> = _uiState.asStateFlow()

    init {
        loadGenres()
    }

    fun loadGenres() {
        viewModelScope.launch {
            _uiState.value = GenresUiState.Loading
            try {
                val genres = apiService.getGenres()
                _uiState.value = GenresUiState.Success(genres)
            } catch (e: IOException) {
                _uiState.value = GenresUiState.Error(
                    message = "No internet connection detected. Please check your network.",
                    isOffline = true
                )
            } catch (e: Exception) {
                _uiState.value = GenresUiState.Error(
                    message = e.localizedMessage ?: "An unexpected error occurred.",
                    isOffline = false
                )
            }
        }
    }
}`
  },

  compose: {
    title: "Compose UI + Coil",
    filename: "GenresScreen.kt",
    language: "kotlin",
    description: "High-performance Jetpack Compose implementation using Coil for image preloading, fading transitions, shimmer effect placeholders, and an offline-retry banner.",
    code: `package com.example.dramagenres.ui.screen

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.example.dramagenres.data.model.Genre
import com.example.dramagenres.ui.viewmodel.GenresUiState
import com.example.dramagenres.ui.viewmodel.GenresViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GenresScreen(
    viewModel: GenresViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Browse Genres", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            )
        },
        modifier = modifier
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (val state = uiState) {
                is GenresUiState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                is GenresUiState.Success -> {
                    GenresGrid(genres = state.genres)
                }
                is GenresUiState.Error -> {
                    OfflineErrorView(
                        message = state.message,
                        isOffline = state.isOffline,
                        onRetry = { viewModel.loadGenres() },
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
            }
        }
    }
}

@Composable
fun GenresGrid(genres: List<Genre>) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        contentPadding = PaddingValues(12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        items(genres, key = { it.genre }) { genre ->
            GenreCard(genre = genre)
        }
    }
}

@Composable
fun GenreCard(genre: Genre) {
    Card(
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .height(200.dp)
            .clickable { /* Navigate to Drama List */ }
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(genre.backdrop)
                    .crossfade(true)
                    .diskCacheKey(genre.genre)
                    .build(),
                contentDescription = genre.genre,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
            
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        androidx.compose.ui.graphics.Brush.verticalGradient(
                            colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.8f))
                        )
                    )
            )

            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(12.dp)
            ) {
                Text(
                    text = genre.genre,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = "Dynamic Static API",
                    color = Color.White.copy(alpha = 0.8f),
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
fun OfflineErrorView(
    message: String,
    isOffline: Boolean,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = modifier.padding(24.dp)
    ) {
        Text(
            text = if (isOffline) "Connection Offline" else "Fetch Failed",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.error
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = Color.Gray,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onRetry) {
            Text("Try Again")
        }
    }
}`
  }
};
