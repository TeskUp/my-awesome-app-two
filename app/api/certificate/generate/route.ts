import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import * as fs from 'fs'
import * as path from 'path'

export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { userName, courseTitle } = await request.json()

    if (!userName || !userName.trim()) {
      return NextResponse.json(
        { error: 'User name is required' },
        { status: 400 }
      )
    }

    // Read template PDF from root directory
    const templatePath = path.join(process.cwd(), 'stranger certificate.pdf')
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: 'Certificate template not found' },
        { status: 404 }
      )
    }

    const templateBytes = fs.readFileSync(templatePath)
    const pdfDoc = await PDFDocument.load(templateBytes)

    // Get the first page
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()

    // Embed a standard font
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

    // Calculate position for name (center of page, between "This to certify that" and "successfully completed")
    // Based on typical certificate layout, the name should be around 48-52% down the page
    // This places it in the blank space between the two text lines
    const nameY = height * 0.50 // Center of the blank space
    const nameX = width / 2 // Center horizontally

    // Draw the user's name with large, beautiful font
    // Use larger font size for better visibility and elegance
    const fontSize = 36 // Large, beautiful font size
    // Use boldFont for width calculation since we're using boldFont to draw
    const textWidth = boldFont.widthOfTextAtSize(userName, fontSize)
    
    firstPage.drawText(userName, {
      x: nameX - textWidth / 2, // Center the text
      y: nameY,
      size: fontSize,
      font: boldFont, // Use bold font for better appearance
      color: rgb(0, 0, 0), // Black color
    })

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save()

    // Return PDF as response
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${userName.replace(/\s+/g, '-')}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating certificate:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to generate certificate' },
      { status: 500 }
    )
  }
}

